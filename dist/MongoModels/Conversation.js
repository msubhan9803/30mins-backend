import mongoose from 'mongoose';
const { Schema } = mongoose;
const ConversationSchema = new Schema({
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blocked: { type: [String], default: [] },
    archived: { type: [String], default: [] },
    hidden: { type: [String], default: [] },
}, { timestamps: true });
const Conversation = mongoose.model('Conversation', ConversationSchema);
export default Conversation;
//# sourceMappingURL=Conversation.js.map