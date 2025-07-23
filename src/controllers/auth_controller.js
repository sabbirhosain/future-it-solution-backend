import mongoose from "mongoose";
import crypto from 'crypto';
import bcrypt from "bcryptjs";
import AuthModel from "../models/auth_model.js";
import createJSONWebToken from "../utils/json_web_token.js";
import { formatDateTime } from "../utils/helper.js";
import { sendEmail } from "../utils/node_mailer.js";
import { uploadCloudinary } from "../multer/cloudinary.js";
import { v2 as cloudinary } from 'cloudinary';
import JWT from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const register = async (req, res) => {
    try {
        const { first_name, last_name, country, phone, email, password, confirm_password, verify_token } = req.body;
        const requiredFields = ['first_name', 'last_name', 'country', 'phone', 'email', 'password', 'confirm_password'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // Password length validation
        if (password.length < 6) {
            return res.status(400).json({ password: 'Password must be at least 6 characters long' });
        }

        // password and confirm password match
        if (password !== confirm_password) {
            return res.json({ message: "Password and Confirm Password doesn't match" });
        }

        // Email domain validation
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'rediffmail.com', 'naver.com', 'qq.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                success: false,
                message: 'Only personal email domains are allowed (gmail, yahoo, outlook, etc.)'
            });
        }

        // check existing email
        const existEmail = await AuthModel.exists({ $or: [{ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }] });
        if (existEmail) { return res.json({ success: false, message: "Email is already exists" }) }

        // existing username, email, phone chack
        const existPhone = await AuthModel.exists({ $or: [{ phone: { $regex: new RegExp(`^${phone.trim()}$`, 'i') } }] });
        if (existPhone) { return res.json({ success: false, message: "Phone is already exists" }) }

        // Generate verification token
        const verifyToken = crypto.randomBytes(32).toString('hex');

        // store the user value
        const result = await new AuthModel({
            date_and_time_formated: formatDateTime(Date.now()),
            first_name: first_name,
            last_name: last_name,
            full_name: first_name + " " + last_name,
            country: country,
            email: email.toLowerCase(),
            phone: phone,
            password: password,
            verify_token: verifyToken
        }).save();

        if (result) {
            await sendEmail({
                to: result.email,
                subject: 'Verify Your Email',
                first_name: result.first_name,
                verify_link: `${process.env.BACKEND_BASE_URL}/api/v1/auth/verify-email?token=${verifyToken}&email=${result.email}`
            });

            return res.json({
                success: true,
                message: 'Please check your email to verify your account.',
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

export const verifyEmail = async (req, res) => {
    try {
        const { token, email } = req.query;
        if (!token || !email) { return res.json({ message: 'Invalid verification link' }) }

        const response = await AuthModel.findOne({ email: email, verify_token: token });
        if (!response) {
            return res.json({ message: 'Verification failed. Invalid token or email.' })
        } else {
            response.isVerified = true;
            response.verify_token = null;
            response.status = 'active';
            await response.save();
        }

        return res.redirect(`${process.env.FRONTEND_BASE_URL}/login`);

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const verifyManually = async (req, res) => {
    try {
        const { id } = req.params

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await AuthModel.findById(id);
        if (!findOne) { return res.json({ message: "Item not found" }) }

        // update
        const result = await AuthModel.findByIdAndUpdate(id, {
            isVerified: true,
            verify_token: null,
            status: 'active'
        }, { new: true })

        if (result) {
            return res.json({
                success: true,
                message: 'Item Verified Success',
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const login = async (req, res) => {
    try {
        const { user, password } = req.body
        if (!user) { return res.json({ user: "feild is required" }) }
        if (!password) { return res.json({ password: "feild is required" }) }

        // Find by existing username, email, phone
        const existing = await AuthModel.findOne({
            $or: [
                { user_name: { $regex: new RegExp(`^${user.trim()}$`, 'i') } },
                { email: { $regex: new RegExp(`^${user.trim()}$`, 'i') } },
                { phone: { $regex: new RegExp(`^${user.trim()}$`, 'i') } }
            ]
        });

        if (!existing) {
            return res.json({ success: false, message: "Invalid credentials. Please register." });
        }

        // Reject admin
        if (existing.isAdmin) {
            return res.json({ success: false, message: "Access denied. Only user accounts can log in here." });
        }

        // Check if email is verified
        if (!existing.isVerified) {
            return res.json({ success: false, message: "Please verify your email before logging in." });
        }

        if (existing.status === 'hold') {
            return res.json({ success: false, message: "Account is on hold. Please contact support." });
        }

        // Check password match
        const passwordMatch = await bcrypt.compare(password, existing.password);
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Invalid credentials. Please try again.' });
        }

        const accessToken = createJSONWebToken({ ...existing.toObject() }, process.env.JWT_SECRET_KEY, "1d");
        const refreshToken = createJSONWebToken({ ...existing.toObject() }, process.env.JWT_SECRET_KEY, '7d');

        // create access token
        res.cookie('accessToken', accessToken, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            maxAge: 1 * 24 * 60 * 60 * 1000 //1 day
        });

        // create refresh token
        res.cookie('refreshToken', refreshToken, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 day
        });

        return res.json({
            success: true,
            message: 'User login successful',
            payload: existing,
            accessToken,
            refreshToken
        });

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

export const adminLogin = async (req, res) => {
    try {
        const { user, password } = req.body
        if (!user) { return res.json({ user: "Phone or email feild is required" }) }
        if (!password) { return res.json({ password: "Password feild is required" }) }

        // Find by existing username, email, phone
        const existing = await AuthModel.findOne({
            $or: [
                { user_name: { $regex: new RegExp(`^${user.trim()}$`, 'i') } },
                { email: { $regex: new RegExp(`^${user.trim()}$`, 'i') } },
                { phone: { $regex: new RegExp(`^${user.trim()}$`, 'i') } }
            ]
        });

        if (!existing) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Only difference from regular login - checks isAdmin
        if (!existing.isAdmin) {
            return res.json({ success: false, message: "Access denied. Only admin can log in." });
        }

        // Check if email is verified
        if (!existing.isVerified) {
            return res.json({ success: false, message: "Please verify your email before logging in." });
        }

        if (existing.status === 'hold') {
            return res.json({ success: false, message: "Account is on hold. Please contact support." });
        }

        // Check password match
        const passwordMatch = await bcrypt.compare(password, existing.password);
        if (!passwordMatch) { return res.json({ success: false, message: 'Invalid credentials' }) }

        const accessToken = createJSONWebToken({ ...existing.toObject() }, process.env.JWT_SECRET_KEY, "1d");
        const refreshToken = createJSONWebToken({ ...existing.toObject() }, process.env.JWT_SECRET_KEY, '7d');

        // create access token
        res.cookie('accessToken', accessToken, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            maxAge: 1 * 24 * 60 * 60 * 1000 //1 day
        });

        // create refresh token
        res.cookie('refreshToken', refreshToken, {
            secure: true,
            httpOnly: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 day
        });

        return res.json({
            success: true,
            message: 'Admin login successful',
            payload: existing,
            accessToken,
            refreshToken
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
        const { from_date = "", to_date = "", status = "", verified = "" } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            isAdmin: { $ne: true }, //If user is admin then it will not show (String)
            $or: [
                { full_name: { $regex: searchQuery } },
                { user_name: { $regex: searchQuery } },
                { email: { $regex: searchQuery } },
                { phone: { $regex: searchQuery } },
                { country: { $regex: searchQuery } },
                { gender: { $regex: searchQuery } },
            ]
        }

        // Add suspended filter
        const allowedStatuses = ['active', 'pending', 'hold'];
        if (status && status !== 'undefined' && status !== 'null' && status !== '' && allowedStatuses.includes(status)) {
            dataFilter.status = status;
        }

        // Add suspended filter
        if (verified !== "") {
            dataFilter.isVerified = verified === "true"; // Convert to boolean
        }

        // Date range filter (only if provided)
        if (from_date || to_date) {
            dataFilter.date_and_time = {};

            if (from_date) {
                const fromDate = new Date(from_date);
                if (!isNaN(fromDate.getTime())) {
                    fromDate.setHours(0, 0, 0, 0);
                    dataFilter.date_and_time.$gte = fromDate;
                }
            }

            if (to_date) {
                const toDate = new Date(to_date);
                if (!isNaN(toDate.getTime())) {
                    toDate.setHours(23, 59, 59, 999);
                    dataFilter.date_and_time.$lte = toDate;
                }
            }
        }

        // Hide specific fields
        const options = { password: 0, first_name: 0, last_name: 0 };

        const result = await AuthModel.find(dataFilter, options)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await AuthModel.find(dataFilter).countDocuments();

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

        const result = await AuthModel.findById(id);

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
        if (!findOne) { return res.json({ message: "Item not found" }) }

        const requiredFields = ['first_name', 'last_name', 'country'];
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
            return res.status(400).json({ user_name: 'username already exists. try another' });
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

        // check exist data
        const findOne = await AuthModel.findById(id);
        if (!findOne) { return res.json({ message: "Item not found" }) }

        const result = await AuthModel.findByIdAndDelete(id);

        // Check not found
        if (!result) {
            return res.json({ success: false, message: "Data not found" });

        } else {
            if (findOne.attachment && findOne.attachment.public_id) {
                await cloudinary.uploader.destroy(findOne.attachment.public_id);
            }

            return res.json({
                success: true,
                message: 'User Destroy Success',
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const verifyToken = async (req, res) => {
    try {
        const { token } = req.body;

        // Validate input
        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                isValid: false,
                message: 'Token is required and must be a string'
            });
        }

        // Verify token
        JWT.verify(token, process.env.JWT_SECRET_KEY);

        return res.json({
            isValid: true,
            message: 'Token is valid',
        });

    } catch (error) {
        console.error('Token verification error:', error.message);

        // Handle specific JWT errors
        if (error instanceof JWT.TokenExpiredError) {
            return res.status(401).json({
                isValid: false,
                error: 'Token expired'
            });
        }

        if (error instanceof JWT.JsonWebTokenError) {
            return res.status(401).json({
                isValid: false,
                error: 'Invalid token'
            });
        }

        return res.status(500).json({
            isValid: false,
            error: 'Internal server error during token verification'
        });
    }
};

export const logout = async (req, res) => {
    try {
        // Check if user is already logged out
        const accessTokenExists = req.cookies.accessToken;
        const refreshTokenExists = req.cookies.refreshToken;

        if (!accessTokenExists && !refreshTokenExists) {
            return res.status(200).json({
                success: false,
                message: 'User is already logged out.',
            });
        }

        // Clear cookies with security options
        res.clearCookie('accessToken', {
            httpOnly: true,
            sameSite: 'none'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'none'
        });

        return res.status(200).json({
            success: true,
            message: 'User logged out success',
        });

    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error'
        });
    }
}

export const passwordChange = async (req, res) => {
    try {
        const { user_id, currentPassword, newPassword, confirmNewPassword } = req.body;

        // Validate required fields
        const requiredFields = ['user_id', 'currentPassword', 'newPassword', 'confirmNewPassword'];
        for (let field of requiredFields) {
            if (!req.body[field]) { return res.json({ [field]: 'Field is required' }) }
        }

        // Check if new passwords match
        if (newPassword !== confirmNewPassword) {
            return res.json({ success: false, message: 'New passwords do not match' });
        }

        // Password validation
        if (newPassword.length < 6) {
            return res.json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Additional password complexity checks (optional)
        if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.json({ success: false, message: 'Password must contain at least one uppercase letter and one number' });
        }

        // Find user
        const existUser = await AuthModel.findById(user_id);
        if (!existUser) { return res.json({ success: false, message: 'User not found' }) }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, existUser.password);
        if (!isMatch) { return res.json({ success: false, message: 'Current password is incorrect' }) }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, existUser.password);
        if (isSamePassword) { return res.json({ success: false, message: 'New password must be different from current password' }) }

        // Hash and update password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        existUser.password = hashedPassword;

        const result = await existUser.save();

        if (result) {
            return res.json({
                success: true,
                message: 'Password changed successfully'
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

export const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) { return res.json({ success: false, message: 'Email is required' }) }

        const existEmail = await AuthModel.findOne({ email });
        if (!existEmail) { return res.json({ success: false, message: 'User not found' }) }

        // Generate reset token and set expiry (1 hour from now)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour in milliseconds

        // Save token to database
        existEmail.resetToken = resetToken;
        existEmail.resetTokenExpiry = resetTokenExpiry;
        const result = await existEmail.save();
        if (result) {
            await sendEmail({
                to: result.email,
                subject: 'Password Reset Instructions',
                first_name: result.first_name,
                verify_link: `${process.env.FRONTEND_BASE_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`
            });
            return res.json({
                success: true,
                message: 'Password reset link sent to your email'
            });
        }

    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error'
        });
    }
}

export const changeRole = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate the mongoose ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // Check if user exists
        const existing = await AuthModel.findById(id);
        if (!existing) {
            return res.json({ success: false, message: "User not found" });
        }

        // Check if status is provided
        if (!status) {
            return res.json({ success: false, message: "Status is required" });
        }

        // Validate status
        const allowedStatuses = ['active', 'hold'];
        if (!allowedStatuses.includes(status)) {
            return res.json({ success: false, message: "Invalid status value" });
        }

        // Update status
        const result = await AuthModel.findByIdAndUpdate(id, { status: status }, { new: true });

        return res.json({
            success: true,
            message: "Status updated successfully",
            payload: result
        });

    } catch (error) {
        return res.json({
            success: false,
            message: error.message || "Internal Server Error"
        });
    }
};

export const tokenGenerate = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const protectedRoutes = async (req, res) => {
    try {
        const accessToken = req.cookies?.accessToken
        if (!accessToken) {
            return res.json({ message: 'Access denied. No token provided. Please login' });
        }
        const decoded = JWT.verify(accessToken, process.env.JWT_SECRET_KEY)
        if (!decoded) {
            return res.json({ message: 'Invalid token. Please login' });
        }

        if (decoded) {
            return res.json({
                success: true,
                massage: 'Protected routes successful',
            });
        }
    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}
