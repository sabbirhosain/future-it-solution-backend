import mongoose from "mongoose";

const PremiumToolsSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    short_description: {
        type: String,
        required: true,
        trim: true
    },

    long_description: {
        type: String,
        required: true,
        trim: true
    },

    additional_feature: {
        type: Array,
        required: true,
        trim: true,
        default: null
    },

    package_details: {
        type: Array,
        required: true,
        trim: true,
        default: null
    },

    price: {
        type: Number,
        required: true,
        trim: true
    },

    price_type: {
        type: String,
        required: true,
        trim: true,
        enum: ['bdt', 'usd']
    },

    discount: {
        type: Number,
        required: true,
        trim: true
    },

    validity: {
        type: String,
        required: true,
        trim: true
    },

    validity_type: {
        type: String,
        required: true,
        trim: true,
        enum: ['day', 'month', 'year']
    },

    rating: {
        type: Number,
        required: true,
        trim: true
    },

    total_sold: {
        type: Number,
        required: true,
        trim: true
    },

    important_note: {
        type: String,
        required: true,
        trim: true
    },

    available: {
        type: Boolean,
        required: true,
        trim: true,
        default: true
    },

    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const PremiumToolsModel = mongoose.model("PremiumTools", PremiumToolsSchema);
export default PremiumToolsModel