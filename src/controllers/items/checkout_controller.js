import mongoose from "mongoose";
import CheckoutModel from "../../models/items/checkout_model.js";

export const create = async (req, res) => {
    try {
        const { isGuestUser, isRegisterUser, items, subtotal, total_discount, tax, shipping_cost, grand_total, currency, payment_method, billing_address, coupon_code, notes } = req.body;

        //required fields
        const requiredFields = ['items', 'payment_method', 'billing_address'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required (string)' });
            }
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Items must be a non-empty array"
            });
        }

        // Validate item structure
        for (const item of items) {
            if (!item.item_id || !item.package_id) {
                return res.status(400).json({
                    status: "error",
                    message: "Each item must contain item and package"
                });
            }

            if (!mongoose.Types.ObjectId.isValid(item.item_id) || !mongoose.Types.ObjectId.isValid(item.package_id)) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid item or package ID format"
                });
            }
        }

        // Validate monetary values
        const monetaryFields = ['subtotal', 'discount_total', 'tax', 'shipping_cost', 'grand_total'];
        for (const field of monetaryFields) {
            if (isNaN(req.body[field]) || req.body[field] < 0) {
                return res.status(400).json({
                    status: "error",
                    message: `${field} must be a positive number`
                });
            }
        }

        // 5. Validate payment method
        const validPaymentMethods = ['credit_card', 'bkash', 'nagad', 'cash_on_delivery', 'rocket'];
        if (!validPaymentMethods.includes(payment_method)) {
            return res.status(400).json({
                status: "error",
                message: `Invalid payment method. Valid methods are: ${validPaymentMethods.join(', ')}`
            });
        }

        // 6. Validate billing address structure
        const requiredAddressFields = ['name', 'email', 'address_line1', 'city', 'state', 'postal_code', 'country'];
        const missingAddressFields = requiredAddressFields.filter(field => !billing_address[field]);

        if (missingAddressFields.length > 0) {
            return res.status(400).json({
                status: "error",
                message: `Missing required billing address fields: ${missingAddressFields.join(', ')}`,
                fields: missingAddressFields
            });
        }


        // 1. Verify calculated totals match (optional security check)
        const calculatedTotal = subtotal - discount_total + tax + shipping_cost;
        if (Math.abs(calculatedTotal - grand_total) > 0.01) { // Allow small floating point differences
            return res.status(400).json({
                status: "error",
                message: "Grand total doesn't match calculated amount"
            });
        }


        // store the order value
        const result = await new CheckoutModel({
            isGuestUser: isGuestUser,
            isRegisterUser: isGuestUser ? undefined : isRegisterUser,
            items: items,
            subtotal: subtotal,
            total_discount: total_discount,
            tax: tax,
            billing_address: billing_address,
            shipping_address: shipping_address || { same_as_billing: true },
            shipping_cost: shipping_cost,
            grand_total: grand_total,
            currency: currency,
            payment_method: payment_method,
            coupon_code: coupon_code,
            notes: notes
        }).save();

        if (result) {
            return res.json({
                success: true,
                message: 'Item Create Success',
                payload: result
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};