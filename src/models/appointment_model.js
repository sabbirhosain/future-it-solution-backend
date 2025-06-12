import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
    date_and_time: {
        type: String,
        trim: true
    },

    client_info: {
        type: Object,
        required: true,
        default: null
    },

    meeting_date: {
        type: Date,
        required: true,
        default: Date.now()
    },

    meeting_date_formated: {
        type: String,
        trim: true
    },

    meeting_time: {
        type: String,
        required: true,
        trim: true,
    },

    time_zone_gmt: {
        type: String,
        trim: true,
        required: true,
        match: /^GMT[+-]\d{1,2}(:\d{2})?$/  // Basic GMT format validation
    },

    language: {
        type: Array,
        trim: true,
        default: null
    },

    meeting_type: {
        type: String,
        required: true,
        trim: true,
        enum: ['google_meet', 'zoom_meet', 'whatsapp_meet']
    },

    meeting_link: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                // More specific validation for each meeting type
                if (this.meeting_type === 'google_meet') {
                    return /^https:\/\/meet\.google\.com\/[a-z-]+$/i.test(v);
                }
                if (this.meeting_type === 'zoom_meet') {
                    return /^https:\/\/zoom\.us\/j\/\d+(\?pwd=\w+)?$/i.test(v);
                }
                return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/.test(v);
            },
            message: props => `${props.value} is not a valid meeting link for ${this.meeting_type}`
        }
    },

    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    }

}, { timestamps: true })

const AppointmentModel = mongoose.model("Appointment", AppointmentSchema);
export default AppointmentModel