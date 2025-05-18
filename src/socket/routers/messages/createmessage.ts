import Express, {Request} from 'express';
import Conversation from '../../../MongoModels/Conversation';
import Message from '../../../MongoModels/Message';
import User from '../../../MongoModels/User';
import mongoose from 'mongoose';

export interface IGetUserAuthInfoRequest extends Request {
  user: string;
}

const createmessage = async (req: IGetUserAuthInfoRequest, res: Express.Response) => {
  const reqUserId: string = req.user;
  let reqReceiverId: string;

  const {message, conversationId, receiver , sender} = req.body;
  if (mongoose.Types.ObjectId.isValid(conversationId)) {
    await Conversation.findOne({_id: conversationId}).then(async (Coversion: any) => {
      if (Coversion) {
        await User.findOne({"accountDetails.email": receiver}).then(async (userdoc: any) => {
          if(userdoc){
            reqReceiverId = userdoc._id.valueOf()
          }
        })
        if (Coversion.members.includes(reqUserId) && Coversion.members.includes(reqReceiverId) ) {
          try {
            await Message.create({
              message: message,
              sender: sender,
              receiver: receiver,
              unread: false,
              conversationId: conversationId,
            });
            const messagedata = await Message.find({conversationId: conversationId})
            const messageDataLength :  number = messagedata.length 
            let isFirstMessage : boolean = false 
            if(messageDataLength >= 2  ){
              isFirstMessage = isFirstMessage
            }else {
              isFirstMessage = true
            }
            const lastMessage = messagedata[messagedata.length - 1];
            res.status(200).json({ isfirstmessage :isFirstMessage , data: lastMessage});
          } catch (err) {
            res.status(500).json(err?.message);
          }
        }
      }
    });
  }
};

export default createmessage;
