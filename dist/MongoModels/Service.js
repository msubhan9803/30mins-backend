import { BW_LIST, PAYMENT_TYPES, SERVICE_AUTH_TYPE, SERVICE_TYPES } from '../constants/enums';
import mongoose from 'mongoose';
const { Schema } = mongoose;
const serviceSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    organizationName: String,
    orgServiceCategory: String,
    serviceType: {
        type: String,
        enum: [
            SERVICE_TYPES.FREELANCING_WORK,
            SERVICE_TYPES.MEETING,
            SERVICE_TYPES.FULL_TIME_JOB,
            SERVICE_TYPES.PART_TIME_JOB,
            SERVICE_TYPES.ROUND_ROBIN,
        ],
        default: SERVICE_TYPES.MEETING,
    },
    title: {
        type: String,
        maxLength: 160,
        required: true,
    },
    slug: {
        type: String,
        maxLength: 254,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        min: 0,
        max: 300,
        required: true,
    },
    isPrivate: Boolean,
    price: {
        type: Number,
        min: 0,
        max: 100000,
    },
    currency: String,
    percentDonated: Number,
    charity: String,
    charityId: { type: Schema.Types.ObjectId, ref: 'Charity', default: null },
    reminders: [String],
    recurringInterval: String,
    conferenceType: {
        type: [String],
    },
    searchTags: [String],
    media: {
        type: {
            type: String,
        },
        link: {
            type: String,
            maxLength: 254,
        },
    },
    paymentType: {
        type: String,
        enum: [PAYMENT_TYPES.DIRECT, PAYMENT_TYPES.ESCROW, PAYMENT_TYPES.MANUAL, PAYMENT_TYPES.NONE],
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    hasReminder: {
        type: Boolean,
        default: false,
    },
    isRecurring: {
        type: Boolean,
        default: false,
    },
    isOrgService: {
        type: Boolean,
        default: false,
    },
    serviceWorkingHours: {
        isCustomEnabled: {
            type: Boolean,
            default: false,
        },
        monday: {
            isActive: {
                type: Boolean,
                default: true,
            },
            availability: [{ start: Number, end: Number }],
        },
        tuesday: {
            isActive: {
                type: Boolean,
                default: true,
            },
            availability: [{ start: Number, end: Number }],
        },
        wednesday: {
            isActive: {
                type: Boolean,
                default: true,
            },
            availability: [{ start: Number, end: Number }],
        },
        thursday: {
            isActive: {
                type: Boolean,
                default: true,
            },
            availability: [{ start: Number, end: Number }],
        },
        friday: {
            isActive: {
                type: Boolean,
                default: true,
            },
            availability: [{ start: Number, end: Number }],
        },
        saturday: {
            isActive: Boolean,
            availability: [{ start: Number, end: Number }],
        },
        sunday: {
            isActive: Boolean,
            availability: [{ start: Number, end: Number }],
        },
    },
    bookingQuestions: [
        {
            questionType: {
                type: String,
                required: true,
            },
            question: {
                type: String,
                required: true,
            },
            required: {
                type: Boolean,
                required: true,
            },
            options: {
                type: [String],
            },
        },
    ],
    emailFilter: {
        type: {
            type: String,
            enum: [BW_LIST.BLACK_LIST, BW_LIST.WHITE_LIST],
            default: BW_LIST.BLACK_LIST,
        },
        emails: [{ type: String }],
        domains: [{ type: String }],
    },
    blackList: {
        emails: [{ type: String }],
        domains: [{ type: String }],
    },
    whiteList: {
        emails: [{ type: String }],
        domains: [{ type: String }],
    },
    image: String,
    roundRobinTeam: { type: Schema.Types.ObjectId, ref: 'RoundRobinTeam' },
    attendeeLimit: { type: Number, default: 1 },
    dueDate: { type: Number, default: 1 },
    otpProtected: { type: Boolean, default: true },
    authenticationType: {
        type: String,
        enum: [
            SERVICE_AUTH_TYPE.NONE,
            SERVICE_AUTH_TYPE.PRE_APPROVED,
            SERVICE_AUTH_TYPE.VERIFIED_ONLY,
        ],
        default: SERVICE_AUTH_TYPE.NONE,
    },
}, { collection: 'services', timestamps: true });
export default mongoose.model('Service', serviceSchema);
//# sourceMappingURL=Service.js.map