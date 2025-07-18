import mongoose from "mongoose";

const CheckoutSchema = new mongoose.Schema({
    date_and_time: {
        type: String,
        trim: true
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Items',
        required: true
    },
    items: {
        item_name: { type: String },
        categories: { type: String },
        package_name: { type: String },
        quantity: { type: Number },
        price: { type: Number },
        currency: { type: String, },
        expired: { type: Number },
        expired_type: { type: String },
        discount: { type: Number },
    },
    send_or_cashout_fee: {
        type: Number,
        trim: true,
        default: 0
    },
    sub_total: {
        type: Number,
        trim: true,
        default: 0
    },
    grand_total: {
        type: Number,
        required: true,
        default: 0
    },
    payment_method: {
        type: String,
        enum: ['credit_card', 'mobile_bank', 'cash_on_delivery', 'bank'],
        default: null
    },
    active_date_and_time: {
        type: Date,
        default: null
    },
    expire_date_and_time: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'returned'],
        default: 'pending'
    },
    attachment: {
        type: Object,
        default: null
    },
    billing_address: {
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
        message: {
            type: String,
            trim: true,
            default: null
        }
    }
}, { timestamps: true });


const CheckoutModel = mongoose.model("Checkout", CheckoutSchema);
export default CheckoutModel;