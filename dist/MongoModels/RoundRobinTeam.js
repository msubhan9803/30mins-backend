import mongoose from 'mongoose';
const { Schema } = mongoose;
const roundRobinTeamSchema = new Schema({
    name: { type: String, max: 256 },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
    teamMembers: [{ memberId: { type: Schema.Types.ObjectId, ref: 'User' }, priority: { type: Number } }],
}, { collection: 'roundRobinTeams' });
export default mongoose.model('RoundRobinTeam', roundRobinTeamSchema);
//# sourceMappingURL=RoundRobinTeam.js.map