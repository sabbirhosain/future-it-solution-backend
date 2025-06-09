import mongoose from "mongoose";
import PremiumToolsModel from "../models/premium_tools_model.js";

export const create = async (req, res) => {
    try {
        const { tools_name, short_description, long_description, additional_feature, package_details, price, price_type, discount, validity, validity_type, rating, total_sold, important_note, available } = req.body;

        const requiredFields = ['tools_name', 'short_description', 'long_description', 'additional_feature', 'package_details', 'price', 'price_type', 'validity', 'validity_type'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // tools name length validation
        if (tools_name.length < 5 || tools_name.length > 25) {
            return res.status(400).json({
                tools_name: 'Tools name must be min 5 and max 25 characters.',
            });
        }

        // file upload
        let attachment = null;
        if (req.file && req.file.path) {
            const cloudinaryResult = await uploadCloudinary(req.file.path, 'Premium Tools');
            if (cloudinaryResult) {
                attachment = cloudinaryResult;
            }
        }

        // store the user value
        const result = await new PremiumToolsModel({
            tools_name: tools_name,
            short_description: short_description,
            long_description: long_description,
            additional_feature: additional_feature,
            package_details: package_details,
            price: price,
            price_type: price_type,
            discount: discount,
            validity: validity,
            validity_type: validity_type,
            rating: rating,
            total_sold: total_sold,
            important_note: important_note,
            available: available
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
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const result = await PremiumToolsModel.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await PremiumToolsModel.find().countDocuments();

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

        const result = await PremiumToolsModel.findById(id);

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
        const { tools_name, short_description, long_description, additional_feature, package_details, price, price_type, discount, validity, validity_type, rating, total_sold, important_note, available } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await PremiumToolsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['tools_name', 'short_description', 'long_description', 'additional_feature', 'package_details', 'price', 'price_type', 'validity', 'validity_type'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // tools name length validation
        if (tools_name.length < 5 || tools_name.length > 25) {
            return res.status(400).json({
                tools_name: 'Tools name must be min 5 and max 25 characters.',
            });
        }

        // attachment upload
        let attachment = findOne.attachment;
        if (req.file && req.file.path) {
            const cloudinaryResult = await uploadCloudinary(req.file.path, 'Premium Tools');
            if (cloudinaryResult) {
                if (findOne.attachment && findOne.attachment.public_id) {
                    await cloudinary.uploader.destroy(findOne.attachment.public_id);
                }
                attachment = cloudinaryResult;
            }
        }

        // update
        const result = await PremiumToolsModel.findByIdAndUpdate(id, {
            tools_name: tools_name,
            short_description: short_description,
            long_description: long_description,
            additional_feature: additional_feature,
            package_details: package_details,
            price: price,
            price_type: price_type,
            discount: discount,
            validity: validity,
            validity_type: validity_type,
            rating: rating,
            total_sold: total_sold,
            important_note: important_note,
            available: available
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

        // check exist data
        const findOne = await PremiumToolsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const result = await PremiumToolsModel.findByIdAndDelete(id);

        // Check not found
        if (!result) {
            return res.json({ success: false, message: "Data not found" });

        } else {
            if (findOne.attachment && findOne.attachment.public_id) {
                await cloudinary.uploader.destroy(findOne.attachment.public_id);
            }

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