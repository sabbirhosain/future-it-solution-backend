import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema({
    date_and_time: {
        type: String,
        trim: true
    },
    title: {
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
    tags: {
        type: Array,
        trim: true,
        default: [],
    },
    features: {
        type: Array,
        trim: true,
        default: [],
    },
    packages: {
        type: [{
            package_name: {
                type: String,
                required: true,
                trim: true
            },
            features: {
                type: Array,
                trim: true,
                default: [],
            },
            quantity: {
                type: Number,
                trim: true,
                default: 1
            },
            price: {
                type: Number,
                trim: true,
                default: 0
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
                trim: true,
                default: 0
            },
            grand_total: {
                type: Number,
                trim: true,
                default: 0
            },
            isRecommended: {
                type: Boolean,
                default: false
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }]
    },
    avg_rating: {
        type: Number,
        trim: true,
        default: 0
    },
    total_sold: {
        type: Number,
        trim: true,
        default: 0
    },
    notes: {
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
    availability: {
        type: String,
        trim: true,
        enum: ['available', 'unavailable'],
        default: 'available'
    },
    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const ServiceModel = mongoose.model("Service", ServiceSchema);
export default ServiceModel