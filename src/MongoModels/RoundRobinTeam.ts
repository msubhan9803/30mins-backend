import {PAYMENT_TYPES, SERVICE_TYPES} from './../constants/enums';
import mongoose from 'mongoose';
import {BW_LIST} from '../constants/enums';

const {Schema} = mongoose;

const roundRobinTeamSchema = new Schema(
  {
    name: {type: String, max: 256},
    organizationId: {type: Schema.Types.ObjectId, ref: 'Organization'},
    teamMembers: [{memberId: {type: Schema.Types.ObjectId, ref: 'User'}, priority: {type: Number}}],
  },
  {collection: 'roundRobinTeams'}
);

export default mongoose.model('RoundRobinTeam', roundRobinTeamSchema);
