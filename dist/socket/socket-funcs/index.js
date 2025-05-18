var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import sendtoreciever from './sendtoreciever';
import sendtosender from './sendtosender';
import typing from "./typing";
var allusers = [];
const addUser = (userId, socketId) => {
    if (userId) {
        allusers.push({ "userId": userId, "socketId": socketId });
    }
};
const removeUser = (socketId) => {
    allusers = allusers.filter(user => user.socketId !== socketId);
};
const SocketSend = (socket, io) => {
    socket.on('get-id', (userid) => {
        addUser(userid, socket.id);
    });
    socket.on('send-message', ({ sender, conversationId, isfirstmmessage, receiver, text }) => __awaiter(void 0, void 0, void 0, function* () {
        sendtoreciever(sender, conversationId, receiver, text, isfirstmmessage, allusers, io);
        sendtosender(sender, conversationId, receiver, text, isfirstmmessage, allusers, io);
    }));
    socket.on('typing-message', ({ conversationId, receiver }) => __awaiter(void 0, void 0, void 0, function* () {
        typing(conversationId, receiver, allusers, io);
    }));
    const uniq = {};
    const FilteredUsers = allusers.filter((obj) => !uniq[obj.userId] && (uniq[obj.userId] = true));
    io.emit('get-online-users', FilteredUsers);
    socket.on('disconnect', () => {
        removeUser(socket.id);
        io.emit('get-online-users', allusers);
    });
};
export default SocketSend;
//# sourceMappingURL=index.js.map