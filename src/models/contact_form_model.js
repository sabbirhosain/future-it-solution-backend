import mongoose from "mongoose";

const ContactFormSchema = new mongoose.Schema({
    date_and_time: {
        type: Date,
        required: true,
        default: Date.now()
    },

    date_and_time_formated: {
        type: String,
        trim: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        trim: true
    },

    address: {
        type: String,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    message: {
        type: String,
        required: true,
        trim: true
    },

    message_status: {
        type: Boolean,
        required: true,
        trim: true,
        default: false
    },

}, { timestamps: true })

const ContactFormModel = mongoose.model("ContactForm", ContactFormSchema);
export default ContactFormModel