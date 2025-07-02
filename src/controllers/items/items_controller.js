import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import { uploadCloudinary } from "../../multer/cloudinary.js";
import ItemsModel from "../../models/items/items_model.js";
import CategoriesModel from "../../models/items/categories_model.js";

export const create = async (req, res) => {
    try {
        const { item_name, categories_id, categories, packages, short_description, long_description, features, notes, status, availability } = req.body;
        const requiredFields = ['item_name', 'categories_id', 'short_description', 'long_description'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required (string)' });
            }
        }

        // Validate category exists
        if (!mongoose.Types.ObjectId.isValid(categories_id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // Validate categories exists
        const findCategory = await CategoriesModel.findById(categories_id);
        if (!findCategory) { return res.json({ success: false, message: "category not found" }) }

        // Validate item name uniqueness (case-insensitive)
        const existing = await ItemsModel.exists({ $or: [{ item_name: { $regex: new RegExp(`^${item_name.trim()}$`, 'i') } }] })
        if (existing) { return res.json({ success: false, message: "Item name already exists" }) }

        // Validate short_description character count (max 100 characters)
        if (short_description.length > 100) {
            return res.json({
                success: false,
                message: 'Short description must be 100 characters or less'
            });
        }

        // Validate additional_feature are arrays
        if (features && !Array.isArray(features)) {
            return res.json({
                success: false,
                message: 'Additional features must be provided as an array'
            });
        }

        // Validate pricing_tiers structure
        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({
                packages: 'At least one pricing tier is required'
            });
        }

        // Validate each pricing tier
        const pricingErrors = [];
        packages.forEach((pack, index) => {
            const tierErrors = [];

            if (!pack.package_name || typeof pack.package_name !== 'string' || pack.package_name.trim() === '') {
                tierErrors.push('Package name is required and must be a non-empty string');
            }

            if (!pack.features || !Array.isArray(pack.features)) {
                tierErrors.push('Features must be an array');
            }

            if (pack.quantity === undefined || pack.quantity === null || typeof pack.quantity !== 'number' || pack.quantity <= 0) {
                tierErrors.push('Quantity is required and must be greater than 0');
            }

            if (pack.price === undefined || pack.price === null || typeof pack.price !== 'number' || pack.price <= 0) {
                tierErrors.push('Price is required and must be greater than 0');
            }

            if (!pack.currency || !['BDT', 'USD'].includes(pack.currency)) {
                tierErrors.push('Currency is required and must be either BDT or USD');
            }

            if (pack.currency_exchange_price === undefined || pack.currency_exchange_price === null || typeof pack.currency_exchange_price !== 'number' || pack.currency_exchange_price <= 0) {
                tierErrors.push('Currency exchange is required and must be greater than 0');
            }

            if (pack.expired !== undefined && pack.expired !== null &&
                (typeof pack.expired !== 'number' || pack.expired <= 0)) {
                tierErrors.push('If provided, expired must be a number greater than 0');
            }

            if (pack.expired_type && !['Day', 'Month', 'Year'].includes(pack.expired_type)) {
                tierErrors.push('Expired type must be Day, Month, or Year if provided');
            }

            if (pack.discount !== undefined && pack.discount !== null &&
                (typeof pack.discount !== 'number' || pack.discount < 0 || pack.discount > 100)) {
                tierErrors.push('Discount must be a number between 0 and 100');
            }

            if (pack.isRecommended !== undefined && typeof pack.isRecommended !== 'boolean') {
                tierErrors.push('isRecommended must be a boolean value if provided');
            }

            if (pack.coupon_code && !/^[A-Z0-9-]+$/.test(pack.coupon_code)) {
                tierErrors.push('Coupon code can only contain letters, numbers, and hyphens');
            }

            if (tierErrors.length > 0) {
                pricingErrors.push(`Package ${index + 1}: ${tierErrors.join(', ')}`);
            }
        });

        if (pricingErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Pricing validation failed',
                details: pricingErrors
            });
        }

        // File upload handling
        let attachment = null;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Premium Tools');
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
        const result = await new ItemsModel({
            item_name: item_name,
            categories_id: categories_id,
            categories: findCategory.categories,
            short_description: short_description,
            long_description: long_description,
            features: features,
            packages: packages,
            notes: notes,
            status: status,
            availability: availability,
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
        const { categories, status, availability } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [
                { item_name: { $regex: searchQuery } }
            ],
        };

        // Category filter (if provided)
        if (categories) {
            if (mongoose.Types.ObjectId.isValid(categories)) {
                dataFilter.categories_id = categories;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
        }

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

        const result = await ItemsModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await ItemsModel.find(dataFilter).countDocuments();

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

        const result = await ItemsModel.findById(id);

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
        const { item_name, categories_id, categories, packages, short_description, long_description, features, notes, status, availability } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await ItemsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['item_name', 'categories_id', 'short_description', 'long_description'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // existing tools name chack
        const existing = await ItemsModel.findOne({ item_name: item_name });
        if (existing && existing._id.toString() !== id) {
            return res.status(400).json({ item_name: 'already exists. try another' });
        }

        const findCategory = await CategoriesModel.findById(categories_id);
        if (!findCategory) {
            return res.json({ message: "category not found" });
        }


        // Validate short_description character count (max 100 characters)
        if (short_description.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Short description must be 100 characters or less'
            });
        }

        // Validate additional_feature are arrays
        if (features && !Array.isArray(features)) {
            return res.status(400).json({
                success: false,
                message: 'Additional features must be provided as an array'
            });
        }

        // Validate pricing_tiers structure
        if (!Array.isArray(packages) || packages.length === 0) {
            return res.status(400).json({
                packages: 'At least one pricing tier is required'
            });
        }

        // Validate each pricing tier
        const pricingErrors = [];
        pricing_tiers.forEach((pack, index) => {
            const tierErrors = [];

            if (!pack.package_name || typeof pack.package_name !== 'string' || pack.package_name.trim() === '') {
                tierErrors.push('Package name is required and must be a non-empty string');
            }

            if (!pack.features || !Array.isArray(pack.features)) {
                tierErrors.push('Features must be an array');
            }
            if (pack.price === undefined || pack.price === null || typeof pack.price !== 'number' || pack.price <= 0) {
                tierErrors.push('Price is required and must be greater than 0');
            }

            if (!pack.currency || !['BDT', 'USD'].includes(pack.currency)) {
                tierErrors.push('Currency is required and must be either BDT or USD');
            }

            if (pack.currency_exchange_price === undefined || pack.currency_exchange_price === null || typeof pack.currency_exchange_price !== 'number' || pack.currency_exchange_price <= 0) {
                tierErrors.push('Currency exchange is required and must be greater than 0');
            }

            if (pack.expired !== undefined && pack.expired !== null &&
                (typeof pack.expired !== 'number' || pack.expired <= 0)) {
                tierErrors.push('If provided, expired must be a number greater than 0');
            }

            if (pack.expired_type && !['Day', 'Month', 'Year'].includes(pack.expired_type)) {
                tierErrors.push('Expired type must be Day, Month, or Year if provided');
            }

            if (pack.discount !== undefined && pack.discount !== null &&
                (typeof pack.discount !== 'number' || pack.discount < 0 || pack.discount > 100)) {
                tierErrors.push('Discount must be a number between 0 and 100');
            }

            if (pack.isRecommended !== undefined && typeof pack.isRecommended !== 'boolean') {
                tierErrors.push('isRecommended must be a boolean value if provided');
            }

            if (pack.coupon_code && !/^[A-Z0-9-]+$/.test(pack.coupon_code)) {
                tierErrors.push('Coupon code can only contain letters, numbers, and hyphens');
            }

            if (tierErrors.length > 0) {
                pricingErrors.push(`Package ${index + 1}: ${tierErrors.join(', ')}`);
            }
        });

        if (pricingErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Pricing validation failed',
                details: pricingErrors
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
        const result = await ItemsModel.findByIdAndUpdate(id, {
            item_name: item_name,
            categories_id: categories_id,
            categories: findCategory,
            short_description: short_description,
            long_description: long_description,
            features: features,
            status: status,
            availability: availability,
            notes: notes,
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
        const findOne = await ItemsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const result = await ItemsModel.findByIdAndDelete(id);

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