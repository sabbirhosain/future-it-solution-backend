import mongoose from "mongoose";
import { v2 as cloudinary } from 'cloudinary';
import { uploadCloudinary } from "../../multer/cloudinary.js";
import CategoriesModel from "../../models/items/categories_model.js";
import FreeItemsModel from "../../models/items/free_items_model.js";

export const create = async (req, res) => {
    try {
        const { item_name, categories_id, short_description, long_description, features, package_name, quantity, price, currency, expired, expired_type, discount, notes } = req.body;
        const requiredFields = ['item_name', 'categories_id', 'short_description', 'long_description', 'package_name', 'quantity', 'price'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                return res.json({ [field]: 'Field is required.' });
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
        const existing = await FreeItemsModel.exists({ $or: [{ item_name: { $regex: new RegExp(`^${item_name.trim()}$`, 'i') } }] })
        if (existing) { return res.json({ success: false, message: "Item name already exists" }) }

        if (features && (!Array.isArray(features) || features.some(feature => typeof feature !== 'string'))) {
            return res.json({ features: 'must be an array of strings' });
        }

        if (!currency || !['BDT', 'USD'].includes(currency)) {
            return res.json({ currency: 'is required and must be either BDT or USD' });
        }

        if (expired_type && !['Day', 'Month', 'Year'].includes(expired_type)) {
            return res.json({ expired_type: 'is must be Day, Month, or Year' });
        }

        // Calculate grand_total if no errors
        const discountAmount = (price * (discount || 0)) / 100;
        const subTotal = Math.max(0, parseFloat((price - discountAmount).toFixed(2)));
        const cashOutFee = Math.max(0, parseFloat(subTotal * 0.02 || 0).toFixed(2));
        const grandTotal = Math.max(0, parseFloat(subTotal + cashOutFee).toFixed(2));

        // File upload handling
        let attachment = null;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Free Tools');
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
        const result = await new FreeItemsModel({
            item_name: item_name,
            categories_id: categories_id,
            categories: findCategory.categories,
            short_description: short_description,
            long_description: long_description,
            features: features,
            package_name: package_name,
            quantity: quantity,
            price: price,
            currency: currency,
            expired: expired,
            expired_type: expired_type,
            discount: discount,
            cash_out_fee: cashOutFee,
            grand_total: grandTotal,
            notes: notes,
            attachment: attachment
        }).save();

        if (result) {
            // Increment items_count in the category
            await CategoriesModel.findByIdAndUpdate(categories_id, { $inc: { items_count: 1 } });

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
        const limit = Number(req.query.limit) || 20;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [{ item_name: { $regex: searchQuery } }],
        };

        // Category filter (if provided and valid)
        if (categories && categories !== 'undefined' && categories !== 'null' && categories !== '') {
            if (mongoose.Types.ObjectId.isValid(categories)) {
                dataFilter.categories_id = categories;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
        }

        // Add status filter (if provided and not empty)
        const allowedStatuses = ['show', 'hide'];
        if (status && status !== 'undefined' && status !== 'null' && status !== '' && allowedStatuses.includes(status)) {
            dataFilter.status = status;
        }

        // Add availability filter (if provided and not empty)
        const allowedAvailability = ['available', 'unavailable'];
        if (availability && availability !== 'undefined' && availability !== 'null' && availability !== '' && allowedAvailability.includes(availability)) {
            dataFilter.availability = availability;
        }

        const result = await FreeItemsModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await FreeItemsModel.find(dataFilter).countDocuments();

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

export const single = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        const result = await FreeItemsModel.findById(id);

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
        const { item_name, categories_id, short_description, long_description, features, package_name, quantity, price, currency, expired, expired_type, discount, notes, status, availability } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await FreeItemsModel.findById(id);
        if (!findOne) { return res.json({ success: false, message: "Item not found" }) }

        const requiredFields = ['item_name', 'categories_id', 'short_description', 'long_description', 'package_name', 'quantity', 'price'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
                return res.json({ success: false, [field]: 'Field is required.' });
            }
        }

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(categories_id)) {
            return res.json({ success: false, message: "Invalid Categories ID format" });
        }

        const findCategory = await CategoriesModel.findById(categories_id);
        if (!findCategory) { return res.json({ success: false, message: "category not found" }) }

        // existing tools name chack
        const existing = await FreeItemsModel.findOne({ item_name: item_name });
        if (existing && existing._id.toString() !== id) {
            return res.json({ item_name: 'already exists. try another' });
        }

        if (features && (!Array.isArray(features) || features.some(feature => typeof feature !== 'string'))) {
            return res.json({ features: 'must be an array of strings' });
        }

        if (!currency || !['BDT', 'USD'].includes(currency)) {
            return res.json({ currency: 'is required and must be either BDT or USD' });
        }

        if (expired_type && !['Day', 'Month', 'Year'].includes(expired_type)) {
            return res.json({ expired_type: 'is must be Day, Month, or Year' });
        }

        if (status && !['show', 'hide'].includes(status)) {
            return res.json({ status: 'must be either show or hide' });
        }

        if (availability && !['available', 'unavailable'].includes(availability)) {
            return res.json({ availability: 'must be either available or unavailable' });
        }

        // Calculate grand_total if no errors
        const discountAmount = (price * (discount || 0)) / 100;
        const subTotal = Math.max(0, parseFloat((price - discountAmount).toFixed(2)));
        const cashOutFee = Math.max(0, parseFloat(subTotal * 0.02 || 0).toFixed(2));
        const grandTotal = Math.max(0, parseFloat(subTotal + cashOutFee).toFixed(2));

        // file upload
        let attachment = findOne.attachment;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Free Tools');
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

        // Check if category changed
        if (findOne.categories_id.toString() !== categories_id) {
            // Decrement old category count
            await CategoriesModel.findByIdAndUpdate(findOne.categories_id, { $inc: { items_count: -1 } });
            // Increment new category count
            await CategoriesModel.findByIdAndUpdate(categories_id, { $inc: { items_count: 1 } });
        }

        // update
        const result = await FreeItemsModel.findByIdAndUpdate(id, {
            item_name: item_name,
            categories_id: categories_id,
            categories: findCategory.categories,
            short_description: short_description,
            long_description: long_description,
            features: features,
            package_name: package_name,
            quantity: quantity,
            price: price,
            currency: currency,
            expired: expired,
            expired_type: expired_type,
            discount: discount,
            cash_out_fee: cashOutFee,
            grand_total: grandTotal,
            notes: notes,
            status: status,
            availability: availability,
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
        const findOne = await FreeItemsModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const result = await FreeItemsModel.findByIdAndDelete(id);

        // Check not found
        if (!result) {
            return res.json({ success: false, message: "Data not found" });

        } else {
            // Decrement the items_count
            await CategoriesModel.findByIdAndUpdate(findOne.categories_id, { $inc: { items_count: -1 } });

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