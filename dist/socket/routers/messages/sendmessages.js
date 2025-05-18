var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import mongoose from 'mongoose';
import Conversation from '../../../MongoModels/Conversation';
import Message from '../../../MongoModels/Message';
import User from '../../../MongoModels/User';
const sendmessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const convId = req.params.convid;
    const reqUserId = req.user;
    if (mongoose.Types.ObjectId.isValid(convId)) {
        yield User.findOne({ "_id": reqUserId }).then((userdoc) => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const Id = userdoc === null || userdoc === void 0 ? void 0 : userdoc._id;
            let myAvatar = (_a = userdoc === null || userdoc === void 0 ? void 0 : userdoc.accountDetails) === null || _a === void 0 ? void 0 : _a.avatar;
            if (Id == reqUserId) {
                const FetchData = () => __awaiter(void 0, void 0, void 0, function* () {
                    yield Conversation.findOne({ "_id": convId }).then((Covers) => __awaiter(void 0, void 0, void 0, function* () {
                        if (Covers) {
                            if (Covers.members.includes(reqUserId)) {
                                try {
                                    yield Message.find({ "conversationId": convId }).then((messages) => __awaiter(void 0, void 0, void 0, function* () {
                                        const messagedata = messages;
                                        res.status(200).json({ myAvatar: myAvatar, "messageData": messagedata });
                                    }));
                                }
                                catch (err) {
                                    res.status(500).json(err === null || err === void 0 ? void 0 : err.message);
                                }
                            }
                        }
                    }));
                });
                FetchData();
            }
        }));
    }
});
export default sendmessages;
//# sourceMappingURL=sendmessages.js.map