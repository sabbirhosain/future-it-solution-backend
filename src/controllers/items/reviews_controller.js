import mongoose from "mongoose";
import ItemsModel from "../../models/items/items_model.js";
import AuthModel from "../../models/auth_model.js";
import { formatDateTime } from "../../utils/helper.js";

export const create = async (req, res) => {
    try {
        const { item_id } = req.params;
        const { user_id, rating, message } = req.body;

        const requiredFields = ['user_id', 'rating', 'message'];
        for (let field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ [field]: 'Field is required' });
            }
        }

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(item_id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID" });
        }

        if (!mongoose.Types.ObjectId.isValid(user_id)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        // Check if item exists
        const itemExist = await ItemsModel.findById(item_id);
        if (!itemExist) { return res.status(404).json({ success: false, message: "Item not found" }) }

        // Check if user exists
        const userExist = await AuthModel.findById(user_id);
        if (!userExist) { return res.status(404).json({ success: false, message: "User not found" }) }

        // Validate rating
        if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.json({ message: "Rating is required and must be between 1 and 5" });
        }

        // Check if user already reviewed this item
        const existingReview = itemExist.reviews.find(review => review.user_id.toString() === user_id);
        if (existingReview) { return res.json({ message: "You have already reviewed this item" }) }

        // Add review to item
        itemExist.reviews.push({
            date_and_time: formatDateTime(Date.now()),
            user_id: user_id,
            user_name: userExist.full_name,
            rating: rating,
            message: message
        });

        // Recalculate average rating
        const totalRatings = itemExist.reviews.reduce((sum, review) => sum + review.rating, 0);
        itemExist.avg_rating = totalRatings / itemExist.reviews.length;

        // Save the updated item
        const result = await itemExist.save();

        if (result) {
            return res.json({
                success: true,
                message: "Review added success",
                review: result.reviews,
                avg_rating: result.avg_rating
            });
        }

    } catch (error) {
        return res.json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

export const show = async (req, res) => {
    try {
        const { item_id } = req.params;
        const { status = 'approved', page = 1, limit = 10 } = req.query;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(item_id)) {
            return res.status(400).json({ success: false, message: "Invalid item ID" });
        }

        // Check if item exists
        const item = await ItemsModel.findById(item_id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Filter reviews by status
        let filteredReviews = item.reviews;
        if (status !== 'all') {
            filteredReviews = item.reviews.filter(
                review => review.isApproved === status
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

        return res.status(200).json({
            success: true,
            totalReviews: filteredReviews.length,
            totalPages: Math.ceil(filteredReviews.length / limit),
            currentPage: page,
            reviews: paginatedReviews,
            avg_rating: item.avg_rating
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

export const update = async (req, res) => {
    try {
        const { item_id, review_id } = req.params;
        const { status } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(item_id) ||
            !mongoose.Types.ObjectId.isValid(review_id)) {
            return res.status(400).json({ success: false, message: "Invalid IDs" });
        }

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'pending', 'approved', or 'rejected'"
            });
        }

        // Find and update review
        const item = await ItemsModel.findOneAndUpdate(
            {
                _id: item_id,
                "reviews._id": review_id
            },
            {
                $set: {
                    "reviews.$.isApproved": status,
                    "reviews.$.message_reply": req.body.message_reply || null
                }
            },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item or review not found"
            });
        }

        // Find the updated review
        const updatedReview = item.reviews.find(
            review => review._id.toString() === review_id
        );

        // Recalculate average rating if status changed to/from approved
        const prevStatus = req.body.previousStatus;
        if ((prevStatus === 'approved' || status === 'approved') && prevStatus !== status) {
            const approvedReviews = item.reviews.filter(
                review => review.isApproved === 'approved'
            );
            const totalRatings = approvedReviews.reduce(
                (sum, review) => sum + review.rating, 0
            );
            item.avg_rating = approvedReviews.length > 0
                ? totalRatings / approvedReviews.length
                : 0;
            await item.save();
        }

        return res.status(200).json({
            success: true,
            message: "Review status updated successfully",
            review: updatedReview,
            avg_rating: item.avg_rating
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

export const destroy = async (req, res) => {
    try {
        const { item_id, review_id } = req.params;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(item_id) ||
            !mongoose.Types.ObjectId.isValid(review_id)) {
            return res.status(400).json({ success: false, message: "Invalid IDs" });
        }

        // Find the item
        const item = await ItemsModel.findById(item_id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Find the review to check if it exists and was approved
        const reviewIndex = item.reviews.findIndex(
            review => review._id.toString() === review_id
        );

        if (reviewIndex === -1) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        const wasApproved = item.reviews[reviewIndex].isApproved === 'approved';
        const reviewRating = item.reviews[reviewIndex].rating;

        // Remove the review
        item.reviews.splice(reviewIndex, 1);

        // Recalculate average rating if the review was approved
        if (wasApproved) {
            const approvedReviews = item.reviews.filter(
                review => review.isApproved === 'approved'
            );
            item.avg_rating = approvedReviews.length > 0
                ? approvedReviews.reduce((sum, review) => sum + review.rating, 0) /
                approvedReviews.length
                : 0;
        }

        await item.save();

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            avg_rating: item.avg_rating
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

export const replyToReview = async (req, res) => {
    try {
        const { item_id, review_id } = req.params;
        const { message_reply } = req.body;

        // Validate input
        if (!mongoose.Types.ObjectId.isValid(item_id) ||
            !mongoose.Types.ObjectId.isValid(review_id)) {
            return res.status(400).json({ success: false, message: "Invalid IDs" });
        }

        if (!message_reply || typeof message_reply !== 'string') {
            return res.status(400).json({
                success: false,
                message: "Reply message is required and must be a string"
            });
        }

        // Find and update review
        const item = await ItemsModel.findOneAndUpdate(
            {
                _id: item_id,
                "reviews._id": review_id
            },
            {
                $set: {
                    "reviews.$.message_reply": message_reply
                }
            },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Item or review not found"
            });
        }

        // Find the updated review
        const updatedReview = item.reviews.find(
            review => review._id.toString() === review_id
        );

        return res.status(200).json({
            success: true,
            message: "Reply added successfully",
            review: updatedReview
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};