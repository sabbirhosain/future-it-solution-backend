import mongoose from "mongoose";
import colors from "colors";

const database_config = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGOOSE_URL);
        console.log(`Database connected: ${connect.connection.name}`.bgMagenta);

    } catch (error) {
        console.error(`Connection error: ${error.message}`.bgRed);
    }
};

export default database_config;
