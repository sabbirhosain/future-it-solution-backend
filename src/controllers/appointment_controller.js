import AppointmentModel from "../models/appointment_model.js";
import { formatDateTime } from "../utils/helper.js";
import jwt from 'jsonwebtoken';

export const create = async (req, res) => {
    try {
        // Get access token from cookies
        const accessToken = req.cookies.accessToken;
        if (!accessToken) {
            return res.json({
                success: false,
                message: "Unauthorized - No access token found"
            });
        }

        // Verify the token and get client info
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY);

        const { meeting_date, meeting_time, time_zone_gmt, language, meeting_type, meeting_reason, status } = req.body
        const requiredFields = ['meeting_date', 'meeting_time', 'time_zone_gmt', 'language', 'meeting_type', 'meeting_reason'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // Check for existing appointment
        const existingAppointment = await AppointmentModel.findOne({
            meeting_date: new Date(meeting_date),
            meeting_time: meeting_time,
            status: { $ne: 'cancelled' } // Ignore cancelled appointments
        });

        if (existingAppointment) {
            return res.json({
                success: false,
                message: "The meeting is already scheduled. Please choose another time"
            });
        }

        // store the value
        const result = await new AppointmentModel({
            date_and_time: formatDateTime(Date.now()),
            client_info: decoded.existing,
            meeting_date: new Date(meeting_date),
            meeting_time: meeting_time,
            time_zone_gmt: time_zone_gmt,
            language: Array.isArray(language) ? language : [language], // Ensure array format
            meeting_type: meeting_type,
            meeting_reason: meeting_reason,
            status: status
        }).save();

        if (result) {
            return res.json({
                success: true,
                message: 'Appointment created success',
                payload: result
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error',
        });
    }
}

export const show = async (req, res) => {
    try {
        const search = req.query.search || "";
        const { join_date_from = "", join_date_to = "", status = "" } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [
                { full_name: { $regex: searchQuery } },
                { user_name: { $regex: searchQuery } },
            ]
        }

        // Add suspended filter
        const allowedStatuses = ['active', 'pending', 'hold'];
        if (status !== "" && allowedStatuses.includes(status)) {
            dataFilter.status = status;
        }

        // Add suspended filter
        if (verified !== "") {
            dataFilter.isVerified = verified === "true"; // Convert to boolean
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


        if (join_date_from || join_date_to) {
            dataFilter.join_date = {};
            if (join_date_from) {
                const fromDate = new Date(join_date_from);
                fromDate.setHours(0, 0, 0, 0);
                dataFilter.join_date.$gte = fromDate;
            }
            if (join_date_to) {
                const toDate = new Date(join_date_to);
                toDate.setHours(23, 59, 59, 999);
                dataFilter.join_date.$lte = toDate;
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

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}