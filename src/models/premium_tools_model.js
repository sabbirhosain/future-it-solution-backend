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
        type: [String],
        default: [],
    },

    package_details: {
        type: [String],
        default: [],
    },

    pricing_tiers: {
        type: [{
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
                min: 0
            },
            currency: {
                type: String,
                required: true,
                enum: ['BDT', 'USD'],
                default: 'BDT'
            },
            expired: {
                type: Number,
                trim: true,
                default: 0
            },
            expired_type: {
                type: String,
                trim: true,
                enum: ['Day', 'Month', 'Year'],
                default: 'Day'
            },
            discount: {
                type: Number,
                default: 0,
                min: 0
            },
        }]
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

    status: {
        type: String,
        trim: true,
        enum: ['show', 'hide'],
        default: 'show'
    },

    coupon_code: {
        type: String,
        trim: true,
        default: null,
        uppercase: true,
        match: [/^[A-Z0-9-]+$/, "Coupon code can only contain letters, numbers, and hyphens"]
    },

    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const PremiumToolsModel = mongoose.model("PremiumTools", PremiumToolsSchema);
export default PremiumToolsModel