import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const AuthSchema = new mongoose.Schema({
    join_date: {
        type: Date,
        required: true,
        default: Date.now()
    },

    join_date_formated: {
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
        unique: true,
        lowercase: true
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: true,
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
        minlength: [6, 'Password must be at least 6 characters long'],
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

    isSuspended: {
        type: Boolean,
        default: false
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