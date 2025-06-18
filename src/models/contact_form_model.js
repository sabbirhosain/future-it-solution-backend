import mongoose from "mongoose";

const ContactFormSchema = new mongoose.Schema({
    date_and_time: {
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
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[0-9]{7,15}$/, 'Please enter a valid phone number']
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

    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },

}, { timestamps: true })

const ContactFormModel = mongoose.model("ContactForm", ContactFormSchema);
export default ContactFormModel