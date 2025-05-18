import Express, {Request} from 'express';
import mongoose from 'mongoose';
import Conversation from '../../../MongoModels/Conversation';
import Message from '../../../MongoModels/Message';
import User from '../../../MongoModels/User';

export interface IGetUserAuthInfoRequest extends Request {
  user: string;
}
interface UserDataEmail {
  accountDetails: {} | null;
  email: string | null;
  _id: string | null;
}

const conversations = async (req: IGetUserAuthInfoRequest, res: Express.Response) => {
  const {receiver, userid} = req.body;
  let reqReceiverId: string 
  const  reqUserId = req.user;
  const consversationFunc = (consversationid)=>{
    consversationid.members = []
    if(consversationid.members.length <1 ){
      consversationid.members = [userid , receiver]
    }
    return(
      consversationid
    )
  }
  await User.findOne({_id: reqUserId}).then(async (userdocdata: any) => {
    if (userdocdata) {
      try {
        await Conversation.find({
          members: {$in: [reqUserId]},
        }).then(async (document: any) => {
          let frienddata: any | {};
          await User.findOne({'accountDetails.email': receiver}).then(async (userdoc: any) => {
            if (userdoc) {
              const friendPersonaldata = await userdoc.personalDetails;
              reqReceiverId = userdoc._id.valueOf()
              let friendData = await userdoc.accountDetails;
              const username: string = friendData.username;
              let avatar: string = friendData.avatar;
              let name: string = friendPersonaldata.name;
              frienddata = {name: name, avatar: avatar, username: username};
            }
          });
          if (document) {
            let filtered = document.filter(
              (conver: any) =>
                conver.members?.includes(reqUserId) && conver.members?.includes(reqReceiverId)
            );
            const ConvId = filtered.map((myconver: UserDataEmail) => {
              return myconver._id.toString();
            });
            if (filtered.length <= 0) {
              try {
                await Conversation.create({members: [reqUserId, reqReceiverId]});
                await Conversation.find({
                  members: {$in: [reqUserId]},
                }).then(async (converdoc: any) => {
                  if (converdoc) {
                    let filteredConver = converdoc.filter(
                      (conv: any) =>
                        conv.members?.includes(reqUserId) && conv.members?.includes(reqReceiverId)
                    );
                    const converdata = filteredConver[0];
                    const SendData = {
                      conversation: [consversationFunc(converdata)],
                      frienddata: frienddata,
                      lastmessage: {},
                    };
                    res
                      .status(200)
                      .json({newuconver: true, conversation: converdata, SendData: SendData});
                  }
                });
              } catch (err: any) {
                res.status(500).json(err);
              }
            } else {
              await Message.findOne({conversationId: ConvId}).then(async (message: any) => {
                if (message) {
                   const consversationFuncA = consversationFunc(filtered)
                  res.status(200).json({newuconver: false, avalibleConv:consversationFuncA });
                } else {
                  const data = {
                    conversation:  consversationFunc(filtered),
                    frienddata: frienddata,
                    lastmessage: {},
                  };
                  res.status(200).json({newuconver: true, SendData: data});
                }
              });
            }
          } else if (document.length <= 0) {
            try {
              await Conversation.create({members: [reqUserId, reqReceiverId]});
              await Conversation.find({
                members: {$in: [reqUserId]},
              }).then(async (converdoc: any) => {
                if (converdoc) {
                  let filteredConver = converdoc.filter(
                    (conv: any) =>
                      conv.members?.includes(reqUserId) && conv.members?.includes(reqReceiverId)
                  );
                  const converdata = filteredConver[0];
                  const SendData = {

                    conversation: consversationFunc(converdata) ,
                    frienddata: frienddata,
                    lastmessage: {},
                  };
                  res.status(200).json({newuconver: true, SendData: SendData});
                }
              });
            } catch (err) {
              res.status(500).json(err);
            }
          }
        });
      } catch (err: any) {
        res.json(err);
      }
    }
  });
};

export default conversations;
