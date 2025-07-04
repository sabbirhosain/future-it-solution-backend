import mongoose from "mongoose";

const CheckoutSchema = new mongoose.Schema({
    items: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Items',
            required: true
        },
        item_name: {
            type: String,
            trim: true,
            default: null
        },
        package_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Items',
            required: true
        },
        package_name: {
            type: Object,
            default: null
        },
    }],
    subtotal: {
        type: Number,
        required: true,
        default: 0
    },
    total_discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shipping_cost: {
        type: Number,
        default: 0
    },
    grand_total: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        enum: ['BDT', 'USD'],
        default: null
    },
    payment_method: {
        type: String,
        enum: ['credit_card', 'bkash', 'nagad', 'cash_on_delivery', 'rocket'],
        default: null
    },
    payment_status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    transaction_id: {
        type: String,
        trim: true
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
    },
    coupon_code: {
        type: String,
        trim: true,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    }
}, { timestamps: true });


const CheckoutModel = mongoose.model("Checkout", CheckoutSchema);
export default CheckoutModel;