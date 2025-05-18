var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const sendtoreciever = (conversationId, receiver, allusers, io) => __awaiter(void 0, void 0, void 0, function* () {
    let receiverid = allusers.filter((send) => (send === null || send === void 0 ? void 0 : send.userId) === receiver);
    receiverid.reverse();
    if (receiverid.length >= 1) {
        receiverid.map((user) => {
            io.to(user === null || user === void 0 ? void 0 : user.socketId).emit('typing', {
                typing: true,
                conversationId: conversationId
            });
        });
    }
});
export default sendtoreciever;
//# sourceMappingURL=typing.js.map