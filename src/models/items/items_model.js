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
                required: true,
                min: 1,
            },
            price: {
                type: Number,
                required: true,
                min: 0,
            },
            currency: {
                type: String,
                required: true,
                enum: ['BDT', 'USD'],
                default: 'BDT'
            },
            currency_exchange_price: {
                type: Number,
                trim: true,
                default: 0
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
                min: 0,
                default: 0
            },
            isRecommended: {
                type: Boolean,
                default: false
            },
            coupon_code: {
                type: String,
                trim: true,
                uppercase: true,
                match: [/^[A-Z0-9-]+$/, "Coupon code can only contain letters, numbers, and hyphens"],
                default: null
            }
        }]
    },
    reviews: {
        type: [{
            user: {
                type: Object,
                required: true,
                default: null
            },
            review_date_and_time: {
                type: Date,
                default: Date.now()
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

const ItemsModel = mongoose.model("Items", ItemsSchema);
export default ItemsModel