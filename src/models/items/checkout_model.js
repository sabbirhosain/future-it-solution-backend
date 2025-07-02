import mongoose from "mongoose";

const CheckoutSchema = new mongoose.Schema({
    isGuestUser: {
        type: Boolean,
        required: true,
        default: false
    },
    isRegisterUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return !this.isGuestUser; } // Only required for registered users
    },

    items: [{
        item_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Items',
            required: true
        },
        item: {
            type: Object,
            default: null
        },
        package_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Packages',
            required: true
        },
        package: {
            type: Object,
            default: null
        }
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
        required: true
    },
    payment_method: {
        type: String,
        enum: ['credit_card', 'bkash', 'nagad', 'cash_on_delivery', 'rocket'],
        required: true
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
            trim: true
        },
        address_line1: {
            type: String,
            required: true,
            trim: true
        },
        address_line2: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        postal_code: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        }
    },
    shipping_address: {
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
            trim: true
        },
        address_line1: {
            type: String,
            required: true,
            trim: true
        },
        address_line2: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        postal_code: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        }
    },
    coupon_code: {
        type: String,
        trim: true,
        default: null
    },
    notes: {
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