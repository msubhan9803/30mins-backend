var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import User from '../../MongoModels/User';
import Conversation from '../../MongoModels/Conversation';
let newRoomData = {};
const newRoom = (conversationId, receiver, sender, text) => __awaiter(void 0, void 0, void 0, function* () {
    yield User.findOne({ 'accountDetails.email': receiver }).then((userdoc) => __awaiter(void 0, void 0, void 0, function* () {
        if (userdoc) {
            const friendPersonaldata = yield userdoc.personalDetails;
            let friendData = yield userdoc.accountDetails;
            const username = friendData.username;
            let avatar = friendData.avatar;
            let name = friendPersonaldata.name;
            const Convers = yield Conversation.findOne({
                "_id": conversationId
            });
            Convers.members = [];
            if (Convers.members.length < 1) {
                Convers.members = [receiver, sender];
            }
            newRoomData = { conversation: Convers, lastmessage: text, frienddata: { name: name, avatar: avatar, username: username } };
        }
    }));
});
const sendtoreciever = (sender, conversationId, receiver, text, isfirstmmessage, allusers, io) => __awaiter(void 0, void 0, void 0, function* () {
    let receiverId = allusers.filter((send) => (send === null || send === void 0 ? void 0 : send.userId) === receiver);
    yield newRoom(conversationId, receiver, sender, text);
    receiverId.reverse();
    if (receiverId.length >= 1) {
        receiverId.map((user) => {
            if (isfirstmmessage) {
                io.to(user === null || user === void 0 ? void 0 : user.socketId).emit('get-message', {
                    sender,
                    text: text,
                    conversationId,
                    isfirstmmessage: isfirstmmessage,
                    roomdate: newRoomData
                });
            }
            else {
                io.to(user === null || user === void 0 ? void 0 : user.socketId).emit('get-message', {
                    sender,
                    text: text,
                    conversationId,
                    isfirstmmessage
                });
            }
        });
    }
});
export default sendtoreciever;
//# sourceMappingURL=sendtoreciever.js.map