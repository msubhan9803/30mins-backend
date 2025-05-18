import mongoose from 'mongoose';
import {SERVICE_TYPES} from '../constants/enums';

const {Schema} = mongoose;

const bookedMeetingSchema = new Schema(
  {
    captchaToken: String,
    confirmed: {
      type: Boolean,
      default: false,
    },
    dateBooked: String,
    meetingCount: {
      type: Number,
      min: 1,
      max: 4,
      required: true,
    },
    bookerName: {
      type: String,
      required: true,
    },
    providerName: {
      type: String,
      required: true,
    },
    bookerEmail: {
      type: String,
      required: true,
    },
    providerEmail: {
      type: String,
      required: true,
    },
    bookerPhone: {
      type: String,
    },
    bookerTimeZone: String,
    ccRecipients: [String],
    additionalNotes: {
      type: String,
    },
    price: Number,
    currency: String,
    paymentType: String,
    paymentAccount: String,
    chargeID: String,
    paymentStatus: String,
    meetingDate: String,
    percentDonated: Number,
    charity: String,
    title: String,
    subject: String,
    conferenceType: String,
    startTime: String,
    endTime: String,
    meetingDuration: Number,
    reminders: [String],
    status: {
      clientConfirmed: {
        type: Boolean,
        default: false,
      },
      clientCanceled: {
        type: Boolean,
        default: false,
      },
      providerConfirmed: {
        type: Boolean,
        default: false,
      },
      providerCanceled: {
        type: Boolean,
        default: false,
      },
      providerDeclined: {
        type: Boolean,
        default: false,
      },
      refundRequested: {
        type: Boolean,
        default: false,
      },
      refundRequestReason: String,
      refunded: {
        type: Boolean,
        default: false,
      },
      hasOpenReport: {
        type: Boolean,
        default: false,
      },
      paymentReleased: {
        type: Boolean,
        default: false,
      },
      rescheduleMeeting: {
        type: Boolean,
        default: false,
      },
      rescheduleMeetingReason: String,
      reportReason: String,
      postMeetingNotes: String,
      postMeetingFeedback: String,
    },
    provider: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    booker: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    serviceID: {type: Schema.Types.ObjectId, ref: 'Service', required: true},
    serviceType: {
      type: String,
      required: true,
      default: SERVICE_TYPES.MEETING,
    },
    answeredQuestions: [
      {
        questionType: {
          type: String,
        },
        question: {
          type: String,
        },
        answer: {
          type: String,
        },
        selectedOptions: {
          type: [String],
        },
      },
    ],

    googleCalendarEvent: {
      googleCalender: Boolean,
      googleCalendarEventId: String,
    },
    officeCalendarEvent: {
      office365Calendar: Boolean,
      office365CalendarEventId: String,
    },
    smsSettings: {
      bookerSms: {
        phone: String,
        reminders: Boolean,
      },
      providerSms: {
        phone: String,
        reminders: Boolean,
      },
    },
  },
  {collection: 'bookedmeetings', timestamps: true}
);

export default mongoose.model('BookedMeeting', bookedMeetingSchema);
