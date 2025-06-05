import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_SECRET_KEY
});


export const uploadCloudinary = async (localFilePath, folderName = "images") => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto', folder: folderName });
        if (response) { fs.unlinkSync(localFilePath); } // Clean local file after successful upload
        return response

    } catch (error) {
        // Remove the locally saved file in case of upload failure
        console.error('Cloudinary upload failed:', error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}