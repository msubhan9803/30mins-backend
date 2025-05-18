import Express, {Request} from 'express';
import Conversation from '../../../MongoModels/Conversation';
import User from '../../../MongoModels/User';
import Message from '../../../MongoModels/Message';
import mongoose from 'mongoose';



export interface IGetUserAuthInfoRequest extends Request {
  user: string;
}
const allconversation = async (req: IGetUserAuthInfoRequest, res: Express.Response) => {
  let UserId = req.params.user;
  const reqUserId = req.user;
  var converData = [];

  if (mongoose.Types.ObjectId.isValid(reqUserId)) {
    await User.findOne({_id: reqUserId}).then(async (userVerfied: any) => {
      if (userVerfied) {
        try {
          await Conversation.find({
            members: {$in: [reqUserId]},
          }).then(async document => {
            await Promise.all(
              document.map(async conv => {
                let frienddata: any | {};
                let  receiver :string 
                const {members}: any = conv;
                const Members: any[] = members;
                let frinedId = Members.filter((friend: any) => {
                  return friend !== reqUserId;
                }).toString();
                await User.findOne({'_id': frinedId}).then(
                  async (userdoc: any) => {
                    if (userdoc) {
                      const friendPersonaldata = await userdoc.personalDetails;
                      let friendData = await userdoc.accountDetails;
                      const username: string = friendData.username;
                      let avatar: string = friendData.avatar;
                      let name: string = friendPersonaldata.name;
                      receiver = friendData.email
                      frienddata = {name: name, avatar: avatar, username: username};
                    }
                  }
                );
                const convId = conv._id.toString('hex');
                await Message.find({conversationId: convId}).then(async (message: any) => {
                  if (message.length >= 1) {
                    const lastmessage = await message[message.length - 1];
                    if (conv._id.toString('hex') === lastmessage.conversationId.toString()) {
                      try {
                        const consversationFunc = (consversationid)=>{
                          consversationid.members = []
                          if(consversationid.members.length <1 ){
                            consversationid.members = [UserId , receiver]
                          }
                          return(
                            consversationid
                          )
                        }
                        return await converData.push({
                          conversation:  consversationFunc(conv),
                          lastmessage: lastmessage,
                          frienddata: frienddata,
                        });
                      } catch (erro) {
                        console.log(erro);
                      }
                    }
                  }
                });
              })
            );
            converData.sort(
              (x: any, y: any) =>
                -new Date(x.lastmessage.createdAt) - -new Date(y.lastmessage.createdAt)
            );            
            res.status(200).json({converData: converData});
          });
        } catch (err) {
          res.status(500).json(err);
        }
      }
    });
  }
};
export default allconversation;
