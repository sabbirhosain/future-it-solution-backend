import mongoose from "mongoose";

const CategoriesSchema = new mongoose.Schema({
    categories: {
        type: String,
        required: true,
        trim: true
    },
    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const CategoriesModel = mongoose.model("Categories", CategoriesSchema);
export default CategoriesModel