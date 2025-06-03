import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import AuthModel from "../models/auth_model.js";
import createJSONWebToken from "../utils/json_web_token.js";
import { formatDateTime } from "../utils/helper.js";

export const register = async (req, res) => {
    try {
        const { first_name, last_name, user_name, phone, email, password, confirm_password } = req.body;

        const requiredFields = ['first_name', 'last_name', 'user_name', 'phone', 'email', 'password', 'confirm_password'];
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

        // Check for spaces or uppercase letters in the username
        if (/\s/.test(user_name) || /[A-Z]/.test(user_name)) {
            return res.json({ user_name: 'Username cannot contain spaces or uppercase letters' });
        }

        // Email domain validation
        const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'aol.com', 'mail.com', 'protonmail.com', 'zoho.com', 'gmx.com', 'rediffmail.com', 'naver.com', 'qq.com'];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!allowedDomains.includes(emailDomain)) {
            return res.status(400).json({
                email: 'Only personal email addresses are allowed'
            });
        }

        // existing username, email, phone chack
        const existing = await AuthModel.exists({
            $or: [
                { user_name: user_name.toLowerCase() },
                { email: email.toLowerCase() },
                { phone: phone }
            ]
        });

        if (existing) {
            return res.json({
                success: false,
                message: "User is already registered please login"
            });
        }

        // store the user value
        const result = await new AuthModel({
            join_date_formated: formatDateTime(Date.now()),
            first_name: first_name,
            last_name: last_name,
            full_name: first_name + " " + last_name,
            user_name: user_name.toLowerCase(),
            email: email.toLowerCase(),
            phone: phone,
            password: password,
        }).save();

        if (result) {
            return res.json({
                success: true,
                message: 'Register Success',
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

export const login = async (req, res) => {
    try {

        // Check if the user is already logged in
        const accessTokenExists = req.cookies.accessToken;
        const refreshTokenExists = req.cookies.refreshToken;

        if (accessTokenExists || refreshTokenExists) {
            return res.json({
                success: false,
                message: 'User is already logged in.',
            });
        }

        const { user, password } = req.body
        if (!user) { return res.json({ user: "Phone or email feild is required" }) }
        if (!password) { return res.json({ password: "Password feild is required" }) }

        // Find by existing username, email, phone
        const existing = await AuthModel.findOne({
            $or: [
                { user_name: user },
                { email: user },
                { phone: user }
            ]
        })

        if (!existing) {
            return res.json({ message: "Invalid credentials please register" })
        }

        // Check password match
        const passwordMatch = await bcrypt.compare(password, existing.password);
        if (!passwordMatch) {
            return res.json({ message: 'User and password does not match' });
        }

        // create access token with set the cookie
        const accessToken = createJSONWebToken({ existing }, process.env.JWT_ACCESS_SECRET_KEY, "1h")
        res.cookie('accessToken', accessToken, {
            // maxAge: 60 * 60 * 1000, //1 hours
            maxAge: 5 * 60 * 1000, //5 min
            secure: true,
            httpOnly: true,
            sameSite: 'none'
        })

        // create refresh token with set the cookie
        const refreshToken = createJSONWebToken({ existing }, process.env.JWT_REFRESH_SECRET_KEY, '7d')
        res.cookie('refreshToken', refreshToken, {
            // maxAge: 7 * 24 * 60 * 60 * 1000, //7 day
            maxAge: 60 * 60 * 1000, //1 hours
            secure: true,
            httpOnly: true,
            sameSite: 'none'
        })

        return res.json({
            success: true,
            message: 'Login Success',
            payload: existing,
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.log(error);
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const show = async (req, res) => {
    try {
        const search = req.query.search || "";
        const { join_date_from = "", join_date_to = "", suspended = "" } = req.query;
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
            ]
        }

        // Add suspended filter
        if (suspended !== "") {
            dataFilter.isSuspended = suspended === "true"; // Convert to boolean
        }

        // Add date filter
        if (join_date_from || join_date_to) {
            dataFilter.join_date = {};
            if (join_date_from) {
                dataFilter.join_date.$gte = new Date(join_date_from); // From date
            }
            if (join_date_to) {
                dataFilter.join_date.$lte = new Date(join_date_to); // To date
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
        const result = await AuthModel.findById(id);

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

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

        const result = await AuthModel.findByIdAndDelete(id);

        // Check not found
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

export const logout = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const passwordChange = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

export const forgetPassword = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
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

export const isSuspended = async (req, res) => {
    try {

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}

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

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}