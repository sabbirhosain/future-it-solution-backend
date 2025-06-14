import mongoose from "mongoose";
import AppointmentModel from "../models/appointment_model.js";
import AuthModel from "../models/auth_model.js";
import { formatDateTime } from "../utils/helper.js";
import jwt from 'jsonwebtoken';

export const create = async (req, res) => {
    try {
        const { login_user_id, meeting_date, meeting_time, time_zone_gmt_and_utc, meeting_type, meeting_reason } = req.body
        const requiredFields = ['login_user_id', 'meeting_date', 'meeting_time', 'time_zone_gmt_and_utc', 'meeting_type', 'meeting_reason'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // check exist data
        const findOne = await AuthModel.findById(login_user_id);
        if (!findOne) {
            return res.json({ message: "User not found" });
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
            date_and_time_formated: formatDateTime(Date.now()),
            login_user_id: login_user_id,
            login_user: findOne,
            meeting_date: new Date(meeting_date),
            meeting_time: meeting_time,
            time_zone_gmt_and_utc: time_zone_gmt_and_utc,
            meeting_type: meeting_type,
            meeting_reason: meeting_reason
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
        const { from_date = "", to_date = "", status = "" } = req.query;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchQuery = new RegExp('.*' + search + '.*', 'i');

        // Add search filter
        const dataFilter = {
            $or: [
                { "appointment_by.full_name": { $regex: searchQuery } },
                { "appointment_by.country": { $regex: searchQuery } },
                { "appointment_by.gender": { $regex: searchQuery } },
                { "appointment_by.address": { $regex: searchQuery } },
                { "appointment_by.email": { $regex: searchQuery } },
                { "appointment_by.phone": { $regex: searchQuery } }
            ]
        };

        // Add status filter
        const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'rescheduled'];
        if (status !== "" && allowedStatuses.includes(status)) {
            dataFilter.status = status;
        }

        // Add date filter
        if (from_date || to_date) {
            dataFilter.date_and_time = {};
            if (join_date_from) {
                const fromDate = new Date(from_date);
                fromDate.setHours(0, 0, 0, 0);
                dataFilter.date_and_time.$gte = fromDate;
            }
            if (to_date) {
                const toDate = new Date(to_date);
                toDate.setHours(23, 59, 59, 999);
                dataFilter.date_and_time.$lte = toDate;
            }
        }

        const result = await AppointmentModel.find(dataFilter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((page - 1) * limit)

        const count = await AppointmentModel.find(dataFilter).countDocuments();

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

        const result = await AppointmentModel.findById(id);

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

        const { meeting_date, meeting_time, time_zone_gmt_and_utc, meeting_type, meeting_reason, meeting_date_and_time, status } = req.body

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findOne = await AppointmentModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const requiredFields = ['meeting_date', 'meeting_time', 'time_zone_gmt_and_utc', 'meeting_type', 'meeting_reason'];
        for (let field of requiredFields) {
            const value = req.body[field];
            if (!value || value.trim() === '') {
                return res.status(400).json({ [field]: 'is required and cannot be empty' });
            }
        }

        // Check for existing appointment
        const existingAppointment = await AppointmentModel.findOne({
            meeting_date: new Date(meeting_date),
            meeting_time: meeting_time,
            status: { $ne: 'cancelled' }, // Ignore cancelled appointments
            'client_info._id': { $ne: decoded.existing._id }
        });

        if (existingAppointment) {
            return res.json({
                success: false,
                message: "The meeting is already scheduled. Please choose another time"
            });
        }

        // update
        const result = await AppointmentModel.findByIdAndUpdate(id, {
            date_and_time_formated: formatDateTime(Date.now()),
            appointment_by: decoded.existing,
            meeting_date: new Date(meeting_date),
            meeting_time: meeting_time,
            time_zone_gmt_and_utc: time_zone_gmt_and_utc,
            meeting_type: meeting_type,
            meeting_reason: meeting_reason,
            meeting_date_and_time: meeting_date_and_time,
            status: status
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
        const findOne = await AppointmentModel.findById(id);
        if (!findOne) {
            return res.json({ message: "Item not found" });
        }

        const result = await AppointmentModel.findByIdAndDelete(id);

        // Check not found
        if (!result) {
            return res.json({ success: false, message: "Data not found" });

        } else {
            return res.json({
                success: true,
                message: 'Destroy Success',
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
}