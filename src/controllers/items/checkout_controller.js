import mongoose from "mongoose";
import CheckoutModel from "../../models/items/checkout_model.js";
import ItemsModel from "../../models/items/items_model.js";

export const create = async (req, res) => {
    try {
        const { items, subtotal, total_discount, tax, shipping_cost, grand_total, currency, payment_method, payment_status, transaction_id, billing_address, shipping_address, coupon_code, status } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                items: 'At least one Items is required'
            });
        }

        const itemsWithNames = [];
        for (const item of items) {
            if (!item.item_id || !item.package_id) {
                return res.json({ message: 'Each item must have item_id, package_id' });
            }

            // Validate items are exist
            if (!mongoose.Types.ObjectId.isValid(item.item_id)) {
                return res.json({ message: "Invalid ID format" })
            }
            const findByItem = await ItemsModel.findById(item.item_id);
            if (!findByItem) { return res.json({ message: 'Item ID Not Found.' }) }

            // Validate packages are exist
            if (!mongoose.Types.ObjectId.isValid(item.package_id)) {
                return res.json({ message: "Invalid Package ID format" })
            }

            // Validate package exists for this item
            const findByPackage = findByItem.packages.find(pkg => pkg._id.toString() === item.package_id);
            if (!findByPackage) { return res.json({ message: 'Package Not Found.' }) }

            // Validate package is active
            if (!findByPackage.isActive) { return res.json({ message: 'Package is not currently available' }) }

            itemsWithNames.push({
                item_id: item.item_id,
                item_name: findByItem.item_name,
                package_id: item.package_id,
                package_name: findByPackage
            });
        }

        // Validate payment method
        // const validPaymentMethods = ['credit_card', 'bkash', 'nagad', 'cash_on_delivery', 'rocket'];
        // if (!validPaymentMethods.includes(payment_method)) {
        //     return res.json({ message: 'Invalid payment method' });
        // }

        // Validate billing address structure
        const requiredAddressFields = ['first_name', 'last_name', 'email', 'phone'];
        for (let field of requiredAddressFields) {
            if (!billing_address?.[field]) {
                return res.status(400).json({ [field]: 'is required (string)' });
            }
        }

        // Verify grand total
        const calculatedTotal = subtotal - total_discount + tax + shipping_cost;
        if (Math.abs(calculatedTotal - grand_total) > 0.01) {
            return res.status(400).json({
                status: "error",
                message: "Grand total doesn't match calculated amount"
            });
        }

        // Save to DB
        const result = await new CheckoutModel({
            items: itemsWithNames,
            billing_address: billing_address
        }).save();

        return res.json({
            success: true,
            message: 'Order Created Success',
            payload: result
        });

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
