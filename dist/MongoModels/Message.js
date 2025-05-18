import mongoose from 'mongoose';
const { Schema } = mongoose;
const MessageSchema = new Schema({
    conversationId: String,
    message: {
        type: String,
        required: true,
    },
    unread: Boolean,
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });
const Message = mongoose.model('Message', MessageSchema);
export default Message;
//# sourceMappingURL=Message.js.map