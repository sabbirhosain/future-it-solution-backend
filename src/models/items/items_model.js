import mongoose from "mongoose";

const ItemsSchema = new mongoose.Schema({
    item_name: {
        type: String,
        required: true,
        trim: true
    },
    categories_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Categories',
        required: true
    },
    categories: {
        type: String,
        trim: true,
        default: null
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
    features: {
        type: Array,
        trim: true,
        default: [],
    },
    package_name: {
        type: String,
        required: true,
        trim: true
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
    cash_out_fee: {
        type: Number,
        trim: true,
        default: 0
    },
    grand_total: {
        type: Number,
        trim: true,
        default: 0
    },
    avg_rating: {
        type: Number,
        trim: true,
        default: 5
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
    reviews: {
        type: [{
            user_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Authentication',
                required: true
            },
            user_name: {
                type: String,
                trim: true,
                default: null
            },
            date_and_time: {
                type: String,
                trim: true
            },
            rating: {
                type: Number,
                trim: true,
                default: 0
            },
            message: {
                type: String,
                trim: true,
                default: null
            },
            isApproved: {
                type: String,
                trim: true,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            },
            message_reply: {
                type: String,
                trim: true,
                default: null
            }
        }]
    }
}, { timestamps: true })

const ItemsModel = mongoose.model("Items", ItemsSchema);
export default ItemsModel