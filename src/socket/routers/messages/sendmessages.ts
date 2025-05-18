import mongoose from 'mongoose';
import Express, {Request} from 'express';
import Conversation from '../../../MongoModels/Conversation';
import Message from '../../../MongoModels/Message';
import User from '../../../MongoModels/User';
export interface IGetUserAuthInfoRequest extends Request {
  user: string;
}
interface userobj {
  accountDetails: {
    avatar : string 
  };
  _id: string;
}
const sendmessages = async (req: IGetUserAuthInfoRequest, res: Express.Response) => {
  const convId = req.params.convid;
  const reqUserId: string = req.user;
  if (
    mongoose.Types.ObjectId.isValid(convId) 
  ) {
    await User.findOne({"_id": reqUserId}).then(async (userdoc: userobj) => {
      const Id: string = userdoc?._id;
      let myAvatar =  userdoc?.accountDetails?.avatar;
      if (Id == reqUserId) {
        const FetchData = async () => {
          await Conversation.findOne({"_id": convId}).then(async (Covers: any) => {
            if (Covers) {
              if (Covers.members.includes(reqUserId)) {
                try {
                  await Message.find({"conversationId": convId}).then(async (messages:any) => {
                    const messagedata : any[] = messages
                    res.status(200).json({ myAvatar : myAvatar , "messageData": messagedata});
                  });
                } catch (err) {
                  res.status(500).json(err?.message);
                }
              }
            }
          });
        };
        FetchData();
      }
    });
  }
};
export default sendmessages;
