import mongoose from "mongoose";
import PremiumToolsModel from "../models/premium_tools_model.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadCloudinary } from "../multer/cloudinary.js";

export const create = async (req, res) => {
    try {
        const { tools_name, short_description, long_description, additional_feature, pricing_tiers, important_note, coupon_code } = req.body;
        const requiredFields = ['tools_name', 'short_description', 'long_description'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required (string)' });
            }
        }

        // existing tools name chack
        const existing = await PremiumToolsModel.exists({
            $or: [{ tools_name: tools_name }]
        });

        if (existing) {
            return res.json({ message: "The Name is already exist. try another" });
        }

        // Validate short_description character count (max 100 characters)
        if (short_description.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Short description must be 100 characters or less'
            });
        }

        // Validate additional_feature are arrays
        if (!Array.isArray(additional_feature)) {
            return res.status(400).json({
                additional_feature: 'must be arrays'
            });
        }

        // Validate pricing_tiers structure
        if (!Array.isArray(pricing_tiers) || pricing_tiers.length === 0) {
            return res.status(400).json({
                pricing_tiers: 'At least one pricing tier is required'
            });
        }

        // Validate each pricing tier
        const pricingErrors = [];
        pricing_tiers.forEach((tier, index) => {
            const tierErrors = [];

            if (!tier.package_name || typeof tier.package_name !== 'string' || tier.package_name.trim() === '') {
                tierErrors.push('Package name is required and must be a non-empty string');
            }

            if (tier.quantity === undefined || tier.quantity === null || tier.quantity <= 0) {
                tierErrors.push('Quantity is required and must be greater than 0');
            }

            if (tier.price === undefined || tier.price === null || tier.price <= 0) {
                tierErrors.push('Price is required and must be greater than 0');
            }

            if (tier.currency_exchange_price === undefined || tier.currency_exchange_price === null || tier.currency_exchange_price <= 0) {
                tierErrors.push('Currency exchange is required and must be greater than 0');
            }

            if (!tier.currency || !['BDT', 'USD'].includes(tier.currency)) {
                tierErrors.push('Currency is required and must be either BDT or USD');
            }

            if (tier.expired !== undefined && tier.expired !== null && tier.expired <= 0) {
                tierErrors.push('Expired must be greater than 0 if provided');
            }

            if (tier.expired_type && !['Day', 'Month', 'Year'].includes(tier.expired_type)) {
                tierErrors.push('Expired type must be Day, Month, or Year if provided');
            }
            if (tier.discount !== undefined && tier.discount !== null && (tier.discount < 0 || tier.discount > 100)) {
                tierErrors.push('Discount must be between 0 and 100');
            }
            if (tierErrors.length > 0) {
                pricingErrors.push(`Tier ${index + 1}: ${tierErrors.join(', ')}`);
            }
        });

        if (pricingErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Pricing validation failed',
                details: pricingErrors
            });
        }

        // Coupon code validation if provided
        if (coupon_code && !/^[A-Z0-9-]+$/.test(coupon_code)) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code can only contain uppercase letters, numbers, and hyphens'
            });
        }

        // File upload handling
        let attachment = null;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Premium Tools');
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
        const result = await new PremiumToolsModel({
            tools_name: tools_name,
            short_description: short_description,
            long_description: long_description,
            additional_feature: additional_feature,
            pricing_tiers: pricing_tiers,
            important_note: important_note,
            coupon_code: coupon_code,
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
        const { status, availability } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [
                { tools_name: { $regex: searchQuery } }
            ],
        };

        // Add status filter
        const allowedStatuses = ['show', 'hide'];
        if (status !== "" && allowedStatuses.includes(status)) {
            dataFilter.status = status;
        }

        // Add availability filter
        const allowedAvailability = ['available', 'unavailable'];
        if (availability !== "" && allowedAvailability.includes(availability)) {
            dataFilter.availability = availability;
        }

        const result = await PremiumToolsModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await PremiumToolsModel.find(dataFilter).countDocuments();

        // Check not found
        if (result.length === 0) {
            return res.json({ success: false, message: "No Data found" });
        } else {
            return res.json({
                success: true,
                message: 'Item Show Success',
                pagination: {
                    per_page: Number(limit),
                    current_page: Number(page),
                    total_data: count,
                    total_page: Math.ceil(count / Number(limit)),
                    previous: Number(page) - 1 > 0 ? Number(page) - 1 : null,
                    next: Number(page) + 1 <= Math.ceil(count / Number(limit)) ? Number(page) + 1 : null
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
        const { tools_name, short_description, long_description, additional_feature, pricing_tiers, important_note, status, coupon_code, availability } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await PremiumToolsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['tools_name', 'short_description', 'long_description', 'important_note'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // existing tools name chack
        const existing = await PremiumToolsModel.findOne({ tools_name: tools_name });
        if (existing && existing._id.toString() !== id) {
            return res.status(400).json({ tools_name: 'already exists. try another' });
        }

        // Validate short_description character count (max 100 characters)
        if (short_description.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Short description must be 100 characters or less'
            });
        }

        // Validate additional_feature are arrays
        if (!Array.isArray(additional_feature)) {
            return res.status(400).json({
                additional_feature: 'must be an arrays'
            });
        }

        // Validate pricing_tiers structure
        if (!Array.isArray(pricing_tiers) || pricing_tiers.length === 0) {
            return res.status(400).json({
                pricing_tiers: 'At least one pricing tier is required'
            });
        }

        // Validate each pricing tier
        const pricingErrors = [];
        pricing_tiers.forEach((tier, index) => {
            const tierErrors = [];

            if (!tier.package_name || typeof tier.package_name !== 'string' || tier.package_name.trim() === '') {
                tierErrors.push('Package name is required and must be a non-empty string');
            }

            if (tier.quantity === undefined || tier.quantity === null || tier.quantity <= 0) {
                tierErrors.push('Quantity is required and must be greater than 0');
            }

            if (tier.price === undefined || tier.price === null || tier.price <= 0) {
                tierErrors.push('Price is required and must be greater than 0');
            }

            if (tier.currency_exchange_price === undefined || tier.currency_exchange_price === null || tier.currency_exchange_price <= 0) {
                tierErrors.push('Currency exchange is required and must be greater than 0');
            }

            if (!tier.currency || !['BDT', 'USD'].includes(tier.currency)) {
                tierErrors.push('Currency is required and must be either BDT or USD');
            }

            if (tier.expired !== undefined && tier.expired !== null && tier.expired <= 0) {
                tierErrors.push('Expired must be greater than 0 if provided');
            }

            if (tier.expired_type && !['Day', 'Month', 'Year'].includes(tier.expired_type)) {
                tierErrors.push('Expired type must be Day, Month, or Year if provided');
            }

            if (tier.discount !== undefined && tier.discount !== null && (tier.discount < 0 || tier.discount > 100)) {
                tierErrors.push('Discount must be between 0 and 100');
            }

            if (tierErrors.length > 0) {
                pricingErrors.push(`Tier ${index + 1}: ${tierErrors.join(', ')}`);
            }
        });

        if (pricingErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Pricing validation failed',
                details: pricingErrors
            });
        }

        // Coupon code validation
        if (coupon_code && !/^[A-Z0-9-]+$/.test(coupon_code)) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code can only contain uppercase letters, numbers, and hyphens'
            });
        }

        // file upload
        let attachment = findOne.attachment;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Premium Tools');
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
        const result = await PremiumToolsModel.findByIdAndUpdate(id, {
            tools_name: tools_name,
            short_description: short_description,
            long_description: long_description,
            additional_feature: additional_feature,
            pricing_tiers: pricing_tiers,
            important_note: important_note,
            status: status,
            availability: availability,
            coupon_code: coupon_code,
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