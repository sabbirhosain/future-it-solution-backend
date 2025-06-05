import multer from "multer"
import fs from 'fs'; //default in nodejs
import path from 'path'; //default in nodejs
import { fileURLToPath } from 'url'; //default in nodejs

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// create file upload directory
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// sotre config
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, UPLOADS_DIR)
    },
    filename: function (req, file, callback) {
        const filename = `image-${Date.now()}.${file.originalname}`
        callback(null, filename)
    }
})

// file type filter
const fileFilter = (req, file, callback) => {
    if (["image/png", "image/jpg", "image/jpeg", "image/gif"].includes(file.mimetype)) {
        callback(null, true);
    } else {
        return callback(new Error("Only .jpg, .jpeg, .png, .gif formats allowed"), false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5000000 }, // Limit file size to 5MB
})

export default upload