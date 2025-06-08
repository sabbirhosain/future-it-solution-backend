import ContactFormModel from "../models/contact_form_model";
import { formatDateTime } from "../utils/helper";

export const create = async (req, res) => {
    try {
        const { date_and_time_formated, name, email, phone, address, subject, message, } = req.body;

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
            date_and_time_formated: formatDateTime(Date.now()),
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

        // Add statis filter
        if (status !== "") {
            dataFilter.message_status = status === "true"; // Convert to boolean
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
        const { first_name, last_name, user_name, gender, country, address } = req.body;

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await AuthModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['first_name', 'last_name', 'user_name'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // Check for spaces or uppercase letters in the username
        if (/\s/.test(user_name) || /[A-Z]/.test(user_name)) {
            return res.json({ user_name: 'Username cannot contain spaces or uppercase letters' });
        }

        // existing date chack
        const existData = await AuthModel.findOne({ user_name: user_name.toLowerCase() });
        if (existData && existData._id.toString() !== id) {
            return res.status(400).json({ user_name: 'Username already exists' });
        }

        // attachment upload
        let attachment = findOne.attachment;
        if (req.file && req.file.path) {
            const cloudinaryResult = await uploadCloudinary(req.file.path, 'User Image');
            if (cloudinaryResult) {
                if (findOne.attachment && findOne.attachment.public_id) {
                    await cloudinary.uploader.destroy(findOne.attachment.public_id);
                }
                attachment = cloudinaryResult;
            }
        }

        // update
        const result = await AuthModel.findByIdAndUpdate(id, {
            first_name: first_name,
            last_name: last_name,
            full_name: first_name + " " + last_name,
            user_name: user_name.toLowerCase(),
            gender: gender,
            country: country,
            address: address,
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