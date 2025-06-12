import mongoose from "mongoose";

const PremiumToolsSchema = new mongoose.Schema({

    tools_name: {
        type: String,
        required: true,
        trim: true
    },

    short_description: {
        type: String,
        trim: true,
        default: null
    },

    long_description: {
        type: String,
        trim: true,
        default: null
    },

    additional_feature: {
        type: Array,
        trim: true,
        default: null
    },

    package_details: {
        type: Array,
        trim: true,
        default: null
    },

    price: {
        type: Number,
        required: true,
        trim: true,
        default: 0
    },

    price_type: {
        type: String,
        trim: true,
        enum: ['BDT', 'USD'],
        default: 'BDT'
    },

    discount: {
        type: Number,
        trim: true,
        default: 0
    },

    validity: {
        type: String,
        trim: true,
        default: 0
    },

    validity_type: {
        type: String,
        trim: true,
        enum: ['Day', 'Month', 'Year'],
        default: 'Day'
    },

    rating: {
        type: Number,
        trim: true,
        default: 0
    },

    total_sold: {
        type: Number,
        trim: true,
        default: 0
    },

    important_note: {
        type: String,
        trim: true,
        default: null
    },

    available: {
        type: Boolean,
        required: true,
        trim: true,
        default: true
    },

    coupon_code: {
        type: String,
        trim: true,
        default: null
    },

    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const PremiumToolsModel = mongoose.model("PremiumTools", PremiumToolsSchema);
export default PremiumToolsModel