import sendtoreciever from './sendtoreciever';
import sendtosender from './sendtosender';
import typing from "./typing"
var allusers = [];
const addUser = (userId: String, socketId: String) => {
  if (userId) {
    allusers.push({"userId" : userId, "socketId" : socketId});
  }
};
const removeUser = (socketId: String) => {
  allusers = allusers.filter(user => user.socketId !== socketId);
};
const SocketSend = (socket: any, io: any) => {
  socket.on('get-id', (userid: String) => {
    addUser(userid, socket.id);
  });

  socket.on('send-message', async ({sender, conversationId,isfirstmmessage , receiver, text}) => {
    sendtoreciever(sender, conversationId, receiver, text,isfirstmmessage,allusers, io);
    sendtosender(sender, conversationId, receiver, text,isfirstmmessage,allusers, io);
  });

  socket.on('typing-message', async ({conversationId, receiver}) => {
    typing(conversationId, receiver,  allusers, io);
  });
  const uniq = {};
  const FilteredUsers = allusers.filter((obj:any) => !uniq[obj.userId] && (uniq[obj.userId] = true));
  io.emit('get-online-users', FilteredUsers);
  socket.on('disconnect', () => {
    removeUser(socket.id);
    io.emit('get-online-users', allusers);
  });
};

export default SocketSend;
