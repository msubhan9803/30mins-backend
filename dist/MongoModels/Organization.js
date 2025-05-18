import mongoose from 'mongoose';
import { PUBLIC_ORGANIZATION_FEATURES } from '../constants/enums';
const { Schema } = mongoose;
const organizationSchema = new Schema({
    createdDate: {
        type: Date,
        default: Date.now,
    },
    affiliateTeamCreatedBy: String,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    restrictionLevel: {
        type: String,
        default: 'OPEN',
    },
    title: {
        type: String,
        maxLength: 254,
        unique: true,
    },
    slug: {
        type: String,
        maxLength: 254,
        match: /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
        unique: true,
    },
    headline: {
        type: String,
        maxLength: 160,
    },
    description: {
        type: String,
    },
    image: String,
    website: String,
    supportEmail: String,
    supportPhone: String,
    location: String,
    socials: {
        twitter: String,
        instagram: String,
        linkedin: String,
        facebook: String,
        youtube: String,
    },
    verified: Boolean,
    searchTags: [String],
    serviceCategories: [String],
    publicFeatures: { type: [String], enum: PUBLIC_ORGANIZATION_FEATURES },
    media: {
        type: {
            type: String,
        },
        link: {
            type: String,
        },
    },
    isPrivate: {
        type: Boolean,
        default: false,
    },
    referralCount: { type: Number, default: 0 },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'OrganizationMembership' }],
}, { collection: 'organizations', timestamps: true });
export default mongoose.model('Organization', organizationSchema);
//# sourceMappingURL=Organization.js.map