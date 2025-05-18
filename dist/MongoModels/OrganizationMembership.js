import mongoose from 'mongoose';
const { Schema } = mongoose;
const organizationMembershipSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    role: String,
}, { collection: 'organizationMemberships' });
export default mongoose.model('OrganizationMembership', organizationMembershipSchema);
//# sourceMappingURL=OrganizationMembership.js.map