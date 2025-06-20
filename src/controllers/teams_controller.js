import mongoose from "mongoose";
import TeamsModel from "../models/teams_model.js";
import { uploadCloudinary } from "../multer/cloudinary.js";
import { formatDateTime } from "../utils/helper.js";
import path from 'path';

export const create = async (req, res) => {
    try {
        const { date_and_time, first_name, last_name, title, phone, email, gender, country, address, social_media, description } = req.body;
        const requiredFields = ['first_name', 'last_name', 'title', 'phone', 'email', 'gender', 'country', 'address'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // Email domain validation
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'rediffmail.com', 'naver.com', 'qq.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                email: 'Only personal email addresses are allowed'
            });
        }


        // File upload handling
        let attachment = null;
        if (req.file && req.file.path) {
            try {
                const fileExt = path.extname(req.file.originalname).toLowerCase();
                const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
                const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

                if (!validExts.includes(fileExt) || !validMimes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP'
                    });
                }

                if (req.file.size > 5 * 1024 * 1024) {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large (max 5MB)'
                    });
                }

                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Our Teams');
                if (cloudinaryResult) {
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

        // store the user value
        const result = await new TeamsModel({
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

        const result = await TeamsModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await TeamsModel.find(dataFilter).countDocuments();

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

        const result = await TeamsModel.findById(id);

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
        const findOne = await TeamsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

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
                const fileExt = path.extname(req.file.originalname).toLowerCase();
                const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
                const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

                if (!validExts.includes(fileExt) || !validMimes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid file type. Allowed: JPG, JPEG, PNG, WEBP'
                    });
                }

                if (req.file.size > 5 * 1024 * 1024) {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large (max 5MB)'
                    });
                }

                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Our Teams');
                if (cloudinaryResult) {
                    // Delete old image if it exists
                    if (attachment && attachment.public_id) {
                        await cloudinary.uploader.destroy(attachment.public_id);
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
        const result = await TeamsModel.findByIdAndUpdate(id, {
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

        const result = await TeamsModel.findByIdAndDelete(id);

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