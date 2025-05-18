import mongoose from 'mongoose';
import {LANGUAGES} from '../constants/enums';

const {Schema} = mongoose;

const userSchema = new Schema(
  {
    forTesting: {
      type: Boolean,
      default: false,
    },
    welcomeComplete: {
      type: Boolean,
      default: false,
    },
    isMarketer: {
      type: Boolean,
      default: false,
    },
    importedBatch: String,
    otpToken: String,
    couponCode: String,
    referralId: String,
    affiliateTeamCreatedBy: String,
    createdBy: {type: Schema.Types.ObjectId, ref: 'User'},
    affiliateTeam: String,
    services: [{type: Schema.Types.ObjectId, ref: 'Service'}],
    events: [{type: Schema.Types.ObjectId, ref: 'Event'}],
    posts: [{type: Schema.Types.ObjectId, ref: 'Post'}],
    publications: [{type: Schema.Types.ObjectId, ref: 'Publication'}],
    educationHistory: [{type: Schema.Types.ObjectId, ref: 'EducationHistory'}],
    jobHistory: [{type: Schema.Types.ObjectId, ref: 'JobHistory'}],
    workingHours: {
      startTime: {
        type: Number,
        default: 540,
      },
      endTime: {
        type: Number,
        default: 1020,
      },
      isCustomEnabled: {
        type: Boolean,
        default: true,
      },
      monday: {
        isActive: {
          type: Boolean,
          default: true,
        },
        availability: {
          type: [{start: Number, end: Number}],
          default: [{start: 540, end: 1020}],
        },
      },
      tuesday: {
        isActive: {
          type: Boolean,
          default: true,
        },
        availability: {
          type: [{start: Number, end: Number}],
          default: [{start: 540, end: 1020}],
        },
      },
      wednesday: {
        isActive: {
          type: Boolean,
          default: true,
        },
        availability: {
          type: [{start: Number, end: Number}],
          default: [{start: 540, end: 1020}],
        },
      },
      thursday: {
        isActive: {
          type: Boolean,
          default: true,
        },
        availability: {
          type: [{start: Number, end: Number}],
          default: [{start: 540, end: 1020}],
        },
      },
      friday: {
        isActive: {
          type: Boolean,
          default: true,
        },
        availability: {
          type: [{start: Number, end: Number}],
          default: [{start: 540, end: 1020}],
        },
      },
      saturday: {
        isActive: Boolean,
        availability: [{start: Number, end: Number}],
      },
      sunday: {
        isActive: Boolean,
        availability: [{start: Number, end: Number}],
      },
    },
    accountDetails: {
      username: {
        type: String,
        maxLength: 32,
        unique: true,
      },
      email: {
        type: String,
        maxLength: 254,
        unique: true,
      },
      avatar: String,
      profileBackground: String,
      createdDate: Number,
      accountType: {
        type: String,
        default: 'provider',
      },
      isIndividual: {
        type: Boolean,
        default: false,
      },
      verifiedAccount: {
        type: Boolean,
        default: false,
      },
      verifiedEmail: {
        type: Boolean,
        default: true,
      },
      privateAccount: {
        type: Boolean,
        default: false,
      },
      acceptedPaymentTypes: {
        type: [String],
        default: ['cheque', 'cash'],
      },
      allowedConferenceTypes: {
        type: [String],
        default: ['onPhone', 'inPerson'],
      },
      stripeAccountId: String,
      upiId: String,
      paypalId: String,
      payoneerId: String,
      paymentAccounts: {
        direct: [String],
        escrow: [String],
      },
      activeExtensions: [String],
      activeExtensionIDs: [{type: Schema.Types.ObjectId, ref: 'ActiveExtension'}],
      credentialIDs: [{type: Schema.Types.ObjectId, ref: 'Credential'}],
      smsSettings: {
        phone: String,
        reminders: Boolean,
      },
    },
    personalDetails: {
      name: {
        type: String,
        maxLength: 100,
      },
      description: {
        type: String,
      },
      headline: {
        type: String,
        maxLength: 160,
      },
      phone: {
        type: String,
      },
      website: {
        type: String,
        maxLength: 254,
      },
      socials: {
        twitter: {
          type: String,
          maxLength: 254,
        },
        instagram: {
          type: String,
          maxLength: 254,
        },
        linkedin: {
          type: String,
          maxLength: 254,
        },
        facebook: {
          type: String,
          maxLength: 254,
        },
        youtube: {
          type: String,
          maxLength: 254,
        },
      },
      searchTags: [String],
      profileMediaLink: {
        type: String,
        maxLength: 254,
      },
      profileMediaType: String,
      language: {
        type: String,
        enum: [
          LANGUAGES.ENGLISH,
          LANGUAGES.ESPANOL,
          LANGUAGES.ITALIAN,
          LANGUAGES.PORTUGUESE,
          LANGUAGES.ROMANIAN,
          LANGUAGES.GERMAN,
        ],
        default: LANGUAGES.ENGLISH,
      },
    },
    locationDetails: {
      country: {
        type: String,
        maxLength: 55,
      },
      timezone: {
        type: String,
        default: 'America/Los_Angeles',
      },
      zipCode: {
        type: String,
        maxLength: 15,
      },
      latitude: Number,
      longitude: Number,
    },
    billingDetails: {
      customerId: {
        type: String,
      },
      fname: {
        type: String,
      },
      lname: {
        type: String,
      },
      address: {
        type: String,
      },
      buildingNumber: {
        type: String,
      },
      city: {
        type: String,
      },
      zipCode: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    wireDetails: {
      nameOnBank: String,
      phoneOfBank: String,
      addressOfBank: String,
      country: String,
    },
    bankDetails: {
      bankName: String,
      bankAddress: String,
      accountNumber: String,
      typeAccount: String,
      categoryAccount: String,
      currencyAccount: String,
      SWIFTBIC: String,
    },
    lastSeen: String,
    lastWarningSent: String,
    verifiedAccount: {type: Boolean, default: false},
  },
  {collection: 'users', timestamps: true, strict: true}
);

userSchema.virtual('meetingsAsProvider', {
  ref: 'BookedMeeting',
  localField: '_id',
  foreignField: 'provider',
});

userSchema.virtual('meetingsAsBooker', {
  ref: 'BookedMeeting',
  localField: '_id',
  foreignField: 'booker',
});

export default mongoose.model('User', userSchema);
