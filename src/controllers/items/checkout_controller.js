import mongoose from "mongoose";
import CheckoutModel from "../../models/items/checkout_model.js";
import ItemsModel from "../../models/items/items_model.js";

export const create = async (req, res) => {
    try {
        const { date_and_time, item_id, items, send_or_cashout_fee, sub_total, grand_total, payment_method, billing_address, status } = req.body;

        const requiredFields = ['item_id'];
        for (let field of requiredFields) {
            if (!req.body[field]) { return res.json({ [field]: 'Field is required (string)' }) }
        }

        // Validate the mongoose id
        if (!mongoose.Types.ObjectId.isValid(item_id)) {
            return res.json({ success: false, message: "Invalid ID format" });
        }

        // check exist data
        const findItem = await ItemsModel.findById(item_id);
        if (!findItem) { return res.json({ success: false, message: "Item not found" }) }

        // Check availability
        if (findItem.availability !== "available") {
            return res.json({ success: false, message: "Item is not available for purchase" });
        }

        // Validate payment method
        const selectPaymentMethods = ['credit_card', 'mobile_bank', 'cash_on_delivery', 'bank'];
        if (!selectPaymentMethods.includes(payment_method)) {
            return res.json({ payment_method: 'Field is required. Use [ credit_card, mobile_bank, cash_on_delivery and bank ]' });
        }

        // Validate billing address structure
        const billingAddress = ['first_name', 'last_name', 'email', 'phone', 'country', 'address'];
        for (let field of billingAddress) {
            if (!billing_address?.[field]) {
                return res.json({ [field]: 'is required (string)' });
            }
        }

        // Verify grand total
        const calculatedTotal = findItem.total_price + (sub_total || 0) + (send_or_cashout_fee || 0);
        if (Math.abs(calculatedTotal - grand_total) > 0.01) {
            return res.status(400).json({
                status: "error",
                message: "Grand total doesn't match calculated amount"
            });
        }

        // Save to DB
        const result = await new CheckoutModel({
            date_and_time: date_and_time,
            item_id: item_id,
            items: {
                item_name: findItem.item_name,
                categories: findItem.categories,
                package_name: findItem.package_name,
                quantity: findItem.quantity,
                price: findItem.price,
                currency: findItem.currency,
                expired: findItem.expired,
                expired_type: findItem.expired_type,
                discount: findItem.discount,
            },
            send_or_cashout_fee: send_or_cashout_fee,
            sub_total: findItem.total_price,
            grand_total: calculatedTotal,
            payment_method: payment_method,
            status: status,
            billing_address: billing_address
        }).save();

        return res.json({
            success: true,
            message: 'Order Success',
            payload: result
        });

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
