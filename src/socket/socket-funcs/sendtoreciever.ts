import User from '../../MongoModels/User';
import Conversation from '../../MongoModels/Conversation';

let newRoomData : {} = {} 



const newRoom = async (conversationId , receiver , sender  , text ) => { 
  await User.findOne({'accountDetails.email': receiver}).then(
    async (userdoc: any) => {
      if (userdoc) {
        const friendPersonaldata = await userdoc.personalDetails;
        let friendData = await userdoc.accountDetails;
        const username: string = friendData.username;
        let avatar: string = friendData.avatar;
        let name: string = friendPersonaldata.name;
        const Convers  : any = await Conversation.findOne({
          "_id" : conversationId
        })
        Convers.members = []
          if(Convers.members.length < 1 ){
            Convers.members = [ receiver , sender]
        }
        newRoomData = {conversation : Convers , lastmessage : text, frienddata : {name: name, avatar: avatar, username: username}}
      }
    }
  )
  }


  
const sendtoreciever = async (sender:string, conversationId:string, receiver:string, text:object, isfirstmmessage : boolean  ,  allusers:any, io:any) => {
  let receiverId = allusers.filter((send:any) => send?.userId === receiver);
  await newRoom(conversationId , receiver , sender  , text) 
  receiverId.reverse();
  if (receiverId.length >= 1) {
    receiverId.map((user: any) => {
      if(isfirstmmessage){
        io.to(user?.socketId).emit('get-message', {
          sender,
          text: text,
          conversationId,
          isfirstmmessage : isfirstmmessage ,
          roomdate : newRoomData
        });
      }else{
        io.to(user?.socketId).emit('get-message', {
          sender,
          text: text,
          conversationId,
          isfirstmmessage
        });
      }
      
    });
  }

};

export default sendtoreciever;
