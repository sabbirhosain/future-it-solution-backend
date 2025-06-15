import ContactFormModel from "../models/contact_form_model.js";
import { formatDateTime } from "../utils/helper.js";

export const create = async (req, res) => {
    try {
        const { name, email, phone, address, subject, message, } = req.body;
        const requiredFields = ['name', 'email', 'phone', 'address', 'subject', 'message'];
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

        // store the user value
        const result = await new ContactFormModel({
            date_and_time: formatDateTime(Date.now()),
            name: name,
            email: email,
            phone: phone,
            address: address,
            subject: subject,
            message: message
        }).save();


        if (result) {
            return res.json({
                success: true,
                message: 'Email Send Success',
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
        const { form_date = "", to_date = "", status = "" } = req.query;
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

        // Add massage filter
        const allowedStatuses = ['pending', 'completed', 'cancelled'];
        if (status !== "" && allowedStatuses.includes(status)) {
            dataFilter.status = status;
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

        const result = await ContactFormModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await ContactFormModel.find(dataFilter).countDocuments();

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

        const result = await ContactFormModel.findById(id);

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
        const { name, email, phone, address, subject, message, } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await ContactFormModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['name', 'email', 'phone', 'address', 'subject', 'message'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // update
        const result = await ContactFormModel.findByIdAndUpdate(id, {
            date_and_time: formatDateTime(Date.now()),
            name: name,
            email: email,
            phone: phone,
            address: address,
            subject: subject,
            message: message
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

        const result = await ContactFormModel.findByIdAndDelete(id);

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