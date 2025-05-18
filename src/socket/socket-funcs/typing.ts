
const sendtoreciever = async (conversationId:string, receiver:string,  allusers:any, io:any) => {
  let receiverid = allusers.filter((send:any) => send?.userId === receiver);
  receiverid.reverse();
  if (receiverid.length >= 1) {
    receiverid.map((user: any) => {
      io.to(user?.socketId).emit('typing', {
        typing: true ,
        conversationId :conversationId
      });
    });
  }

};

export default sendtoreciever;
