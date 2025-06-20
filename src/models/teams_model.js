import mongoose from "mongoose";

const TeamsSchema = new mongoose.Schema({
    date_and_time: {
        type: Date,
        default: Date.now()
    },

    date_and_time_formated: {
        type: String,
        trim: true
    },

    first_name: {
        type: String,
        required: true,
        trim: true
    },

    last_name: {
        type: String,
        required: true,
        trim: true
    },

    full_name: {
        type: String,
        trim: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        trim: true,
        required: true,
        lowercase: true,
        validate: {
            validator: function (v) { return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v) },
            message: "Please enter a valid email"
        },
    },

    gender: {
        type: String,
        trim: true,
        enum: ['male', 'female']
    },

    country: {
        type: String,
        trim: true,
        default: null
    },

    address: {
        type: String,
        trim: true,
        default: null
    },

    social_media: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true;

                const patterns = [
                    /^https:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+$/i,                  //facebook
                    /^https:\/\/(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/i,                     //twitter
                    /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+$/i,               //linkedin
                    /^https:\/\/(www\.)?youtube\.com\/(channel|c|user)\/[a-zA-Z0-9_-]+$/i,  //youtube
                    /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/i,                  //instagram
                    /^skype:[a-zA-Z0-9_.-]+(\?call)?$/i,                                    //skype
                    /^https:\/\/t\.me\/[a-zA-Z0-9_]+$/i,                                    //telegram 
                    /^https:\/\/wa\.me\/\d+$/i,                                             //whatsApp 
                    /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i                                 //(http/https/ftp)
                ];

                return patterns.some(regex => regex.test(v));
            },
            message: 'Invalid social media or meeting URL'
        },
        default: null
    },

    description: {
        type: String,
        trim: true,
        default: null
    },

    attachment: {
        type: Object,
        default: null
    },

}, { timestamps: true })

const TeamsModel = mongoose.model("Teams", TeamsSchema);
export default TeamsModel