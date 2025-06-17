import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema({
    date_and_time: {
        type: Date,
        default: Date.now()
    },

    date_and_time_formated: {
        type: String,
        trim: true
    },

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Authentication',
        required: true
    },

    user: {
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

    meeting_date_and_time: {
        type: String,
        trim: true,
        default: null
    },

    time_zone_gmt_and_utc: {
        type: String,
        trim: true,
        required: true
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
        },
        default: null
    },

    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    }

}, { timestamps: true })

const AppointmentModel = mongoose.model("Appointment", AppointmentSchema);
export default AppointmentModel