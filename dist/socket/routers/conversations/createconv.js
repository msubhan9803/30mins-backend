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
const conversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiver, userid } = req.body;
    let reqReceiverId;
    const reqUserId = req.user;
    const consversationFunc = (consversationid) => {
        consversationid.members = [];
        if (consversationid.members.length < 1) {
            consversationid.members = [userid, receiver];
        }
        return (consversationid);
    };
    yield User.findOne({ _id: reqUserId }).then((userdocdata) => __awaiter(void 0, void 0, void 0, function* () {
        if (userdocdata) {
            try {
                yield Conversation.find({
                    members: { $in: [reqUserId] },
                }).then((document) => __awaiter(void 0, void 0, void 0, function* () {
                    let frienddata;
                    yield User.findOne({ 'accountDetails.email': receiver }).then((userdoc) => __awaiter(void 0, void 0, void 0, function* () {
                        if (userdoc) {
                            const friendPersonaldata = yield userdoc.personalDetails;
                            reqReceiverId = userdoc._id.valueOf();
                            let friendData = yield userdoc.accountDetails;
                            const username = friendData.username;
                            let avatar = friendData.avatar;
                            let name = friendPersonaldata.name;
                            frienddata = { name: name, avatar: avatar, username: username };
                        }
                    }));
                    if (document) {
                        let filtered = document.filter((conver) => { var _a, _b; return ((_a = conver.members) === null || _a === void 0 ? void 0 : _a.includes(reqUserId)) && ((_b = conver.members) === null || _b === void 0 ? void 0 : _b.includes(reqReceiverId)); });
                        const ConvId = filtered.map((myconver) => {
                            return myconver._id.toString();
                        });
                        if (filtered.length <= 0) {
                            try {
                                yield Conversation.create({ members: [reqUserId, reqReceiverId] });
                                yield Conversation.find({
                                    members: { $in: [reqUserId] },
                                }).then((converdoc) => __awaiter(void 0, void 0, void 0, function* () {
                                    if (converdoc) {
                                        let filteredConver = converdoc.filter((conv) => { var _a, _b; return ((_a = conv.members) === null || _a === void 0 ? void 0 : _a.includes(reqUserId)) && ((_b = conv.members) === null || _b === void 0 ? void 0 : _b.includes(reqReceiverId)); });
                                        const converdata = filteredConver[0];
                                        const SendData = {
                                            conversation: [consversationFunc(converdata)],
                                            frienddata: frienddata,
                                            lastmessage: {},
                                        };
                                        res
                                            .status(200)
                                            .json({ newuconver: true, conversation: converdata, SendData: SendData });
                                    }
                                }));
                            }
                            catch (err) {
                                res.status(500).json(err);
                            }
                        }
                        else {
                            yield Message.findOne({ conversationId: ConvId }).then((message) => __awaiter(void 0, void 0, void 0, function* () {
                                if (message) {
                                    const consversationFuncA = consversationFunc(filtered);
                                    res.status(200).json({ newuconver: false, avalibleConv: consversationFuncA });
                                }
                                else {
                                    const data = {
                                        conversation: consversationFunc(filtered),
                                        frienddata: frienddata,
                                        lastmessage: {},
                                    };
                                    res.status(200).json({ newuconver: true, SendData: data });
                                }
                            }));
                        }
                    }
                    else if (document.length <= 0) {
                        try {
                            yield Conversation.create({ members: [reqUserId, reqReceiverId] });
                            yield Conversation.find({
                                members: { $in: [reqUserId] },
                            }).then((converdoc) => __awaiter(void 0, void 0, void 0, function* () {
                                if (converdoc) {
                                    let filteredConver = converdoc.filter((conv) => { var _a, _b; return ((_a = conv.members) === null || _a === void 0 ? void 0 : _a.includes(reqUserId)) && ((_b = conv.members) === null || _b === void 0 ? void 0 : _b.includes(reqReceiverId)); });
                                    const converdata = filteredConver[0];
                                    const SendData = {
                                        conversation: consversationFunc(converdata),
                                        frienddata: frienddata,
                                        lastmessage: {},
                                    };
                                    res.status(200).json({ newuconver: true, SendData: SendData });
                                }
                            }));
                        }
                        catch (err) {
                            res.status(500).json(err);
                        }
                    }
                }));
            }
            catch (err) {
                res.json(err);
            }
        }
    }));
});
export default conversations;
//# sourceMappingURL=createconv.js.map