import {SERVICE_AUTH_TYPE, EVENT_STATUS_TYPES, EVENT_RECURRING_TYPES} from '../constants/enums';
import mongoose from 'mongoose';

const {Schema} = mongoose;

const eventSchema = new Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    serviceType: {
      type: String,
      required: true,
    },
    serviceTitle: {
      type: String,
      maxLength: 160,
      required: true,
    },
    serviceTitleOriginal: {
      type: String,
      maxLength: 160,
      required: true,
    },
    serviceDuration: {
      type: Number,
      min: 0,
      max: 300,
      required: true,
    },
    serviceAttendeeLimit: {type: Number, default: 1},
    serviceAttendeeCount: {type: Number, default: 0},
    serviceSlug: {
      type: String,
      maxLength: 254,
      required: true,
    },
    serviceSlugOriginal: {
      type: String,
      maxLength: 160,
      required: true,
    },
    serviceDateTime: {type: String, default: null},
    serviceRecurring: {
      type: String,
      enum: [
        EVENT_RECURRING_TYPES.NOT_RECURRING,
        EVENT_RECURRING_TYPES.WEEKLY,
        EVENT_RECURRING_TYPES.MONTHLY,
      ],
      default: EVENT_RECURRING_TYPES.NOT_RECURRING,
    },
    serviceDescription: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    serviceAttendeesMessage: {
      type: String,
      required: true,
    },
    searchTags: [String],
    serviceQuestions: {
      type: Boolean,
      required: true,
    },
    serviceQuestionsList: [
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
    eventStatus: {
      type: String,
      enum: [
        EVENT_STATUS_TYPES.CANCELLED,
        EVENT_STATUS_TYPES.UPCOMING,
        EVENT_STATUS_TYPES.CONCLUDED,
      ],
      default: EVENT_STATUS_TYPES.UPCOMING,
    },
    serviceImage: String,
    serviceMedia: {
      type: {
        type: String,
      },
      link: {
        type: String,
        maxLength: 254,
      },
    },
    otpProtected: {type: Boolean, default: true},
    authenticationType: {
      type: String,
      enum: [
        SERVICE_AUTH_TYPE.NONE,
        SERVICE_AUTH_TYPE.PRE_APPROVED,
        SERVICE_AUTH_TYPE.VERIFIED_ONLY,
      ],
      default: SERVICE_AUTH_TYPE.NONE,
    },
  },
  {collection: 'events', timestamps: true}
);

export default mongoose.model('Event', eventSchema);
