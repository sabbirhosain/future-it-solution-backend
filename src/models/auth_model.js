import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const AuthSchema = new mongoose.Schema({
    date_and_time: {
        type: Date,
        default: Date.now()
    },

    date_and_time_formated: {
        type: String,
        trim: true
    },

    first_name: {
        type: String,
        required: true,
        trim: true
    },

    last_name: {
        type: String,
        required: true,
        trim: true
    },

    full_name: {
        type: String,
        trim: true
    },

    user_name: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },

    phone: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email"
        },
    },

    password: {
        type: String,
        required: true,
        trim: true,
        set: (value) => bcrypt.hashSync(value, bcrypt.genSaltSync(10))
    },

    gender: {
        type: String,
        trim: true,
        enum: ['male', 'female']
    },

    country: {
        type: String,
        trim: true,
        default: null
    },

    address: {
        type: String,
        trim: true,
        default: null
    },

    isAdmin: {
        type: Boolean,
        default: false
    },

    status: {
        type: String,
        enum: ['active', 'pending', 'hold'],
        default: 'pending'
    },

    isVerified: {
        type: Boolean,
        default: false
    },

    verify_token: {
        type: String,
        trim: true,
        default: null
    },

    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const AuthModel = mongoose.model("Authentication", AuthSchema);
export default AuthModel