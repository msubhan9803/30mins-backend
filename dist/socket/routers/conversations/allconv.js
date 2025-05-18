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
import User from '../../../MongoModels/User';
import Message from '../../../MongoModels/Message';
import mongoose from 'mongoose';
const allconversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let UserId = req.params.user;
    const reqUserId = req.user;
    var converData = [];
    if (mongoose.Types.ObjectId.isValid(reqUserId)) {
        yield User.findOne({ _id: reqUserId }).then((userVerfied) => __awaiter(void 0, void 0, void 0, function* () {
            if (userVerfied) {
                try {
                    yield Conversation.find({
                        members: { $in: [reqUserId] },
                    }).then((document) => __awaiter(void 0, void 0, void 0, function* () {
                        yield Promise.all(document.map((conv) => __awaiter(void 0, void 0, void 0, function* () {
                            let frienddata;
                            let receiver;
                            const { members } = conv;
                            const Members = members;
                            let frinedId = Members.filter((friend) => {
                                return friend !== reqUserId;
                            }).toString();
                            yield User.findOne({ '_id': frinedId }).then((userdoc) => __awaiter(void 0, void 0, void 0, function* () {
                                if (userdoc) {
                                    const friendPersonaldata = yield userdoc.personalDetails;
                                    let friendData = yield userdoc.accountDetails;
                                    const username = friendData.username;
                                    let avatar = friendData.avatar;
                                    let name = friendPersonaldata.name;
                                    receiver = friendData.email;
                                    frienddata = { name: name, avatar: avatar, username: username };
                                }
                            }));
                            const convId = conv._id.toString('hex');
                            yield Message.find({ conversationId: convId }).then((message) => __awaiter(void 0, void 0, void 0, function* () {
                                if (message.length >= 1) {
                                    const lastmessage = yield message[message.length - 1];
                                    if (conv._id.toString('hex') === lastmessage.conversationId.toString()) {
                                        try {
                                            const consversationFunc = (consversationid) => {
                                                consversationid.members = [];
                                                if (consversationid.members.length < 1) {
                                                    consversationid.members = [UserId, receiver];
                                                }
                                                return (consversationid);
                                            };
                                            return yield converData.push({
                                                conversation: consversationFunc(conv),
                                                lastmessage: lastmessage,
                                                frienddata: frienddata,
                                            });
                                        }
                                        catch (erro) {
                                            console.log(erro);
                                        }
                                    }
                                }
                            }));
                        })));
                        converData.sort((x, y) => -new Date(x.lastmessage.createdAt) - -new Date(y.lastmessage.createdAt));
                        res.status(200).json({ converData: converData });
                    }));
                }
                catch (err) {
                    res.status(500).json(err);
                }
            }
        }));
    }
});
export default allconversation;
//# sourceMappingURL=allconv.js.map