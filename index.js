import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import database_config from "./src/config/database_config.js";
import api_base_router from "./src/routes/api_base_router.js";

dotenv.config();
const PORT = process.env.SERVER_PORT || 5000;

// connect the express with middleware
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));


app.use(cors()); // CORS policy
database_config(); // database connection
app.use("/api/v1", api_base_router); // first version api base url


// running the server GET request
app.get("/", (req, res) => {
    res.send("Server running Successfully!")
})

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})