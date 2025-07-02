import mongoose from "mongoose";
import OurTeamsModel from "../models/our_teams_model.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadCloudinary } from "../multer/cloudinary.js";
import { formatDateTime } from "../utils/helper.js";

export const create = async (req, res) => {
    try {
        const { date_and_time, first_name, last_name, title, phone, email, gender, country, address, social_media, description } = req.body;
        const requiredFields = ['first_name', 'last_name', 'title', 'phone', 'email', 'gender', 'country', 'address'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // Check if phone or email already exists
        const existingPhone = await OurTeamsModel.exists({ phone: phone });
        const existingEmail = await OurTeamsModel.exists({ email: email });
        if (existingPhone) { return res.json({ message: "This phone number already exists." }) };
        if (existingEmail) { return res.json({ message: "This email already exists." }) };


        // Email domain validation
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'rediffmail.com', 'naver.com', 'qq.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!allowedDomains.includes(emailDomain)) {
            return res.status(400).json({ email: 'Only personal email addresses are allowed' });
        }


        // File upload handling
        let attachment = null;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Our Teams');
                if (cloudinaryResult) { attachment = cloudinaryResult }
                
            } catch (fileError) {
                console.error('File upload error:', fileError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing file upload'
                });
            }
        }

        // store the user value
        const result = await new OurTeamsModel({
            date_and_time: date_and_time || new Date(),
            date_and_time_formated: formatDateTime(date_and_time || new Date()),
            first_name: first_name,
            last_name: last_name,
            full_name: `${first_name} ${last_name}`,
            title: title,
            email: email,
            phone: phone,
            gender: gender,
            country: country,
            address: address,
            social_media: social_media,
            description: description,
            attachment: attachment
        }).save();

        if (result) {
            return res.json({
                success: true,
                message: 'Item Create Success',
                payload: result
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const show = async (req, res) => {
    try {
        const search = req.query.search || "";
        const { form_date = "", to_date = "" } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 2;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [
                { name: { $regex: searchQuery } },
                { email: { $regex: searchQuery } },
                { phone: { $regex: searchQuery } },
            ]
        }

        // Add date filter
        if (form_date || to_date) {
            dataFilter.date_and_time = {};
            if (form_date) {
                dataFilter.date_and_time.$gte = new Date(form_date); // From date
            }
            if (to_date) {
                dataFilter.date_and_time.$lte = new Date(to_date); // To date
            }
        }

        const result = await OurTeamsModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await OurTeamsModel.find(dataFilter).countDocuments();

        // Check not found
        if (result.length === 0) {
            return res.json({ success: false, message: "No Data found" });
        } else {
            return res.json({
                success: true,
                message: 'Item Show Success',
                pagination: {
                    per_page: limit,
                    current_page: page,
                    total_data: count,
                    total_page: Math.ceil(count / limit),
                    previous: page - 1 > 0 ? page - 1 : null,
                    next: page + 1 <= Math.ceil(count / limit) ? page + 1 : null
                },
                payload: result,
            });
        }
    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const single = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        const result = await OurTeamsModel.findById(id);

        // Check not found
        if (!result) {
            return res.json({ message: "Data not found" });
        } else {
            return res.json({
                success: true,
                message: 'Item Show Success',
                payload: result
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const update = async (req, res) => {
    try {
        const { id } = req.params
        const { date_and_time, first_name, last_name, title, phone, email, gender, country, address, social_media, description } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await OurTeamsModel.findById(id);
        if (!findOne) { return res.json({ message: "Item not found" }) }

        const requiredFields = ['first_name', 'last_name', 'title', 'phone', 'email', 'gender', 'country', 'address'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // file upload
        let attachment = findOne.attachment;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Our Teams');
                if (cloudinaryResult) {
                    if (attachment && attachment.public_id) {
                        await cloudinary.uploader.destroy(attachment.public_id); // Delete old image if it exists
                    }
                    attachment = cloudinaryResult;
                }
            } catch (fileError) {
                console.error('File upload error:', fileError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing file upload'
                });
            }
        }

        // update
        const result = await OurTeamsModel.findByIdAndUpdate(id, {
            date_and_time: date_and_time || new Date(),
            date_and_time_formated: formatDateTime(date_and_time || new Date()),
            first_name: first_name,
            last_name: last_name,
            full_name: `${first_name} ${last_name}`,
            title: title,
            email: email,
            phone: phone,
            gender: gender,
            country: country,
            address: address,
            social_media: social_media,
            description: description,
            attachment: attachment
        }, { new: true })

        if (result) {
            return res.json({
                success: true,
                message: 'Item Update Success',
                payload: result
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const destroy = async (req, res) => {
    try {
        const { id } = req.params

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        const result = await OurTeamsModel.findByIdAndDelete(id);

        if (!result) {
            return res.json({ success: false, message: "Data not found" });

        } else {
            return res.json({
                success: true,
                message: 'Item Destroy Success',
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}