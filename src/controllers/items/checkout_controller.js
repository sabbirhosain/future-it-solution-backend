import mongoose from "mongoose";
import CheckoutModel from "../../models/items/checkout_model.js";
import ItemsModel from "../../models/items/items_model.js";
import { v2 as cloudinary } from 'cloudinary';
import { uploadCloudinary } from "../../multer/cloudinary.js";
import { calculateTimeDifference, formatDateTime } from "../../utils/helper.js";

export const create = async (req, res) => {
    try {
        const { date_and_time, item_id, billing_address } = req.body;

        const requiredFields = ['item_id'];
        for (let field of requiredFields) {
            if (!req.body[field]) { return res.json({ [field]: 'Field is required (string)' }) }
        }

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(item_id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findItem = await ItemsModel.findById(item_id);
        if (!findItem) { return res.json({ success: false, message: "Item not found" }) }

        // Check availability
        if (findItem.availability !== "available") {
            return res.json({ success: false, message: "Item is not available for purchase" });
        }

        // Validate billing address structure
        const billingAddress = ['first_name', 'last_name', 'email', 'phone', 'country', 'address'];
        for (let field of billingAddress) {
            if (!billing_address?.[field]) {
                return res.json({ [field]: 'is required (string)' });
            }
        }

        // Save to DB
        const result = await new CheckoutModel({
            date_and_time: date_and_time,
            item_id: item_id,
            item_name: findItem.item_name,
            categories: findItem.categories,
            package: {
                package_name: findItem.package_name,
                quantity: findItem.quantity,
                price: findItem.price,
                currency: findItem.currency,
                expired: findItem.expired,
                expired_type: findItem.expired_type,
                discount: findItem.discount,
                cash_out_fee: findItem.cash_out_fee,
                grand_total: findItem.grand_total
            },
            billing_address: {
                ...billing_address,
                full_name: billing_address.first_name + " " + billing_address.last_name
            }
        }).save();

        return res.json({
            success: true,
            message: 'Order Success',
            payload: result
        });

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

export const show = async (req, res) => {
    try {
        const search = req.query.search || "";
        const { payment, active_date, expire_date, status } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Create base filter
        const dataFilter = {
            $or: [
                { 'items.item_name': { $regex: searchQuery } },
                { 'billing_address.full_name': { $regex: searchQuery } },
                { 'billing_address.email': { $regex: searchQuery } },
                { 'billing_address.phone': { $regex: searchQuery } }
            ]
        };

        // Add date filter
        if (active_date || expire_date) {
            if (active_date) {
                const activeDate = new Date(active_date);
                activeDate.setHours(0, 0, 0, 0);
                dataFilter.active_date_and_time = { $gte: activeDate };
            }
            if (expire_date) {
                const expireDate = new Date(expire_date);
                expireDate.setHours(23, 59, 59, 999);
                if (dataFilter.active_date_and_time) {
                    dataFilter.active_date_and_time.$lte = expireDate;
                } else {
                    dataFilter.expire_date_and_time = { $lte: expireDate };
                }
            }
        }

        // Payment method validation and filter
        const paymentMethod = ['credit_card', 'mobile_bank', 'cash_on_delivery', 'bank']
        if (payment && paymentMethod.includes(payment)) {
            dataFilter.payment_method = payment;
        }

        // Status validation and filter
        const validStatus = ['pending', 'completed', 'cancelled', 'returned'];
        if (status && validStatus.includes(status)) {
            dataFilter.status = status;
        }

        const result = await CheckoutModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await CheckoutModel.find(dataFilter).countDocuments();

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

        const result = await CheckoutModel.findById(id);

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
        const { payment_method, billing_address, active_date_and_time, expire_date_and_time, expire_in, notes, status } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findItem = await CheckoutModel.findById(id);
        if (!findItem) { return res.json({ success: false, message: "Item not found" }) }

        // Validate payment method
        const selectPaymentMethods = ['credit_card', 'mobile_bank', 'cash_on_delivery', 'bank'];
        if (!selectPaymentMethods.includes(payment_method)) {
            return res.json({ payment_method: 'Field is required. Use [ credit_card, mobile_bank, cash_on_delivery and bank ]' });
        }

        // Validate payment method
        const selectStatus = ['pending', 'completed', 'cancelled', 'returned'];
        if (!selectStatus.includes(status)) {
            return res.json({ status: 'Field is required. Use [ pending, completed, cancelled, returned ]' });
        }

        // If the status changes, the total_sold amount will change.
        let totalSoldUpdate = 0;
        if (status && findItem.status !== status) {
            if (status === 'completed' && findItem.status !== 'completed') {
                totalSoldUpdate = 1;
            } else if (status === 'cancelled' && findItem.status === 'completed') {
                totalSoldUpdate = -1;
            }
        }

        // Validate billing address structure
        const billingAddress = ['first_name', 'last_name', 'email', 'phone', 'country', 'address'];
        for (let field of billingAddress) {
            if (!billing_address?.[field]) {
                return res.json({ [field]: 'is required (string)' });
            }
        }

        // Validate and calculate expire_in
        let calculatedExpireIn = expire_in;
        if (active_date_and_time && expire_date_and_time) {
            if (new Date(expire_date_and_time) <= new Date(active_date_and_time)) {
                return res.json({ success: false, message: 'Expire date must be after active date' });
            }
            calculatedExpireIn = calculateTimeDifference(active_date_and_time, expire_date_and_time);
        }

        // file upload
        let attachment = findItem.attachment;
        if (req.file && req.file.path) {
            try {
                const cloudinaryResult = await uploadCloudinary(req.file.path, 'Checkout');
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
        const result = await CheckoutModel.findByIdAndUpdate(id, {
            payment_method: payment_method,
            active_date_and_time: active_date_and_time,
            expire_date_and_time: expire_date_and_time,
            active_date_and_time_formated: formatDateTime(active_date_and_time),
            expire_date_and_time_formated: formatDateTime(expire_date_and_time),
            expire_in: calculatedExpireIn,
            notes: notes,
            status: status,
            attachment: attachment,
            billing_address: {
                ...billing_address,
                full_name: billing_address.first_name + " " + billing_address.last_name
            }
        }, { new: true })

        // Update total_sold in ItemsModel if needed
        if (totalSoldUpdate !== 0 && mongoose.Types.ObjectId.isValid(result.item_id)) {
            await ItemsModel.findByIdAndUpdate(result.item_id, { $inc: { total_sold: totalSoldUpdate } });
        }

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
        const findOne = await CheckoutModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const result = await CheckoutModel.findByIdAndDelete(id);

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