import mongoose from 'mongoose';
const { Schema } = mongoose;
const globalBussinessSchema = new Schema({
    totalRevenue: { type: Number },
    totalMonthlyRecurringRevenue: { type: Number },
    totalAnnualRecurringRevenue: { type: Number },
    totalOrganizationRevenue: { type: Number },
    totalOrganizationMonthlyRecurringRevenue: { type: Number },
    totalOragnizationAnnualRecurringRevenue: { type: Number },
    totalUsersSignedUp: { type: Number },
    totalUsersVerified: { type: Number },
    totalUsersWelcomeComplete: { type: Number },
    totalOrganizationsSignedUp: { type: Number },
    timeStamp: { type: String, default: new Date().toISOString() },
}, { collection: 'globalBussiness' });
export default mongoose.model('GlobalBussiness', globalBussinessSchema);
//# sourceMappingURL=GlobalBussiness.js.map