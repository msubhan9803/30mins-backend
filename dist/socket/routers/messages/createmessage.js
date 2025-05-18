var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Conversation from '../../../MongoModels/Conversation';
import Message from '../../../MongoModels/Message';
import User from '../../../MongoModels/User';
import mongoose from 'mongoose';
const createmessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const reqUserId = req.user;
    let reqReceiverId;
    const { message, conversationId, receiver, sender } = req.body;
    if (mongoose.Types.ObjectId.isValid(conversationId)) {
        yield Conversation.findOne({ _id: conversationId }).then((Coversion) => __awaiter(void 0, void 0, void 0, function* () {
            if (Coversion) {
                yield User.findOne({ "accountDetails.email": receiver }).then((userdoc) => __awaiter(void 0, void 0, void 0, function* () {
                    if (userdoc) {
                        reqReceiverId = userdoc._id.valueOf();
                    }
                }));
                if (Coversion.members.includes(reqUserId) && Coversion.members.includes(reqReceiverId)) {
                    try {
                        yield Message.create({
                            message: message,
                            sender: sender,
                            receiver: receiver,
                            unread: false,
                            conversationId: conversationId,
                        });
                        const messagedata = yield Message.find({ conversationId: conversationId });
                        const messageDataLength = messagedata.length;
                        let isFirstMessage = false;
                        if (messageDataLength >= 2) {
                            isFirstMessage = isFirstMessage;
                        }
                        else {
                            isFirstMessage = true;
                        }
                        const lastMessage = messagedata[messagedata.length - 1];
                        res.status(200).json({ isfirstmessage: isFirstMessage, data: lastMessage });
                    }
                    catch (err) {
                        res.status(500).json(err === null || err === void 0 ? void 0 : err.message);
                    }
                }
            }
        }));
    }
});
export default createmessage;
//# sourceMappingURL=createmessage.js.map