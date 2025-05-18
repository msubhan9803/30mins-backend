/* eslint-disable @typescript-eslint/no-unused-vars */

import jwt from 'jsonwebtoken';
import {v4 as uuid} from 'uuid';
import {AccessToken} from '../../../../constants/types';
import MutualAuths from '../../../../MongoModels/MutualAuths';
import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';
import User from '../../../../MongoModels/User';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';

type IAuthsActoins = 'CONNECT' | 'ACCEPT' | 'DECLINE' | 'CANCEL' | 'REMOVEACCESS' | 'SENDREQUEST';

interface IProps {
  token: string;
  ownerEmail: string;
  origin: string;
  actoin: IAuthsActoins;
  AuthCode?: string;
}

async function findMutualAuthbyId(_id) {
  let document = await MutualAuths.findById(_id).populate('_id', [
    'accountDetails.email',
    'accountDetails.username',
  ]);
  if (!document) {
    document = await MutualAuths.create({
      _id: _id,
    });
  }
  return document;
}

async function AcceptMutualRequest(_id, guestId) {
  const document = await MutualAuths.findByIdAndUpdate(_id, {
    $push: {
      guests: guestId,
    },
  }).then(el => el);
  return document;
}

async function findMutualAuthRequestbyId(_id, receiverId) {
  const document = await MutualAuthRequest.find({sender: _id, receiver: receiverId}).then(el => el);
  return document;
}

async function removeMutualAuthRequest(_id, guestId) {
  const document = await MutualAuthRequest.findOneAndDelete({sender: _id, receiver: guestId}).then(
    el => el
  );
  return document;
}

async function createMutualAuthRequestbyId(sender, receiver, origin) {
  const document = await MutualAuthRequest.create({
    sender: sender,
    receiver,
    origin,
    authCode: uuid(),
  }).then(el => el);
  return document;
}

async function declineMutualRequest(_id: any, receiver: any) {
  const document = await MutualAuthRequest.findOneAndRemove({
    sender: _id,
    receiver,
  }).then(el => el);
  return document;
}

async function removeMutualAuthAccess(_id: any, _id1: any) {
  await MutualAuths.findByIdAndUpdate(_id.toString(), {
    $pull: {
      guests: _id1,
    },
  });

  await MutualAuths.findByIdAndUpdate(_id1.toString(), {
    $pull: {
      guests: _id,
    },
  });
}

// eslint-disable-next-line consistent-return
export default async function updateMutualAuths(
  _,
  {actoin, ownerEmail, origin, token, AuthCode}: IProps,
  context
) {
  let startLogId: String;
  let decodedToken;
  let IUser;
  let GUser;
  const Idocument = [];
  const Gdocument = [];
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;

  try {
    // find owner
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updateMutualAuths',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'ownerEmail',
          paramValue: ownerEmail,
          paramType: typeof ownerEmail,
        },
        {
          paramName: 'actoin',
          paramValue: actoin,
          paramType: typeof actoin,
        },
        {
          paramName: 'AuthCode',
          paramValue: AuthCode,
          paramType: typeof AuthCode,
        },
      ],
    });

    // Users or document
    if (token) {
      decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
      const UserExists = await User.exists({_id: decodedToken?.UserId});
      if (!UserExists) {
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getMutualAuthsById',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: 'User Document Not Found',
          startLogId,
        });
        return {
          response: {
            message: `User_Not_Found`,
            status: 200,
          },
        };
      }

      IUser = await User.findById(decodedToken.UserId).exec();
      GUser = await User.findOne({'accountDetails.email': ownerEmail})
        .orFail(() => {
          throw new Error('emial_not_found');
        })
        .exec();

      if (IUser._id.toString() === GUser._id.toString()) {
        throw new Error('you_can_not_send_a_request_to_yourself');
      }

      if (actoin === 'ACCEPT' || actoin === 'DECLINE') {
        Idocument[1] = await MutualAuthRequest.findOne({
          sender: GUser._id,
          receiver: IUser._id,
        }).orFail(() => {
          throw new Error('this_request_already_had_used');
        });
        if (Idocument[1].sender.toString() === IUser._id.toString()) {
          throw new Error('you_can_not_accept_or_decline_this_request');
        }
      }
    } else if (AuthCode) {
      if (context.token !== SECRETS.BACKEND_API_KEY) {
        throw new Error('invalid_permissions:invalid_API_key');
      }
      Idocument[1] = await MutualAuthRequest.findOne({authCode: AuthCode}).orFail(() => {
        throw new Error('this_request_already_had_used');
      });
    } else {
      throw new Error('faild!');
    }

    // find the guest
    switch (actoin) {
      case 'CONNECT': // front-end A token
        Idocument[0] = await findMutualAuthbyId(IUser._id);
        Gdocument[0] = await findMutualAuthbyId(GUser._id);
        if (
          Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
          Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())
        ) {
          // eslint-disable-next-line no-case-declarations
          const newToken = jwt.sign({UserId: GUser._id}, accessTokenSecret, {
            algorithm: 'HS256',
            expiresIn: '7d',
          });
          return {
            response: {
              message: 'you_have_access_to_this_account',
              status: 200,
            },
            token: newToken,
          };
        }

        throw new Error('you_do_not_have_access_to_this_account');
        break;
      case 'ACCEPT': // front-end A token | auth-code
        if (Idocument[1]) {
          Idocument[0] = await findMutualAuthbyId(Idocument[1].sender);
          Gdocument[0] = await findMutualAuthbyId(Idocument[1].receiver);

          if (
            !Idocument[0].guests
              .map(el => el._id.toString())
              .includes(Idocument[1].receiver.toString())
          ) {
            await AcceptMutualRequest(Idocument[1].sender, Idocument[1].receiver);
          }

          if (
            !Idocument[0].guests
              .map(el => el._id.toString())
              .includes(Idocument[1].sender.toString())
          ) {
            await AcceptMutualRequest(Idocument[1].receiver, Idocument[1].sender);
          }
          await sendEmail(
            {
              Iname: Gdocument[0]._id.accountDetails.username,
              Gname: Idocument[0]._id.accountDetails.username,
              action: 'accepted',
            },
            Idocument[0]._id.accountDetails.email,
            TEMPLATES.MUTUAL_AUTH.SEND_REQUEST_MESSAGE
          );
          await removeMutualAuthRequest(Idocument[1].sender, Idocument[1].receiver);
          return {
            response: {
              message: 'your_request_has_been_accepted_successfully',
              status: 200,
            },
          };
        }
        throw new Error('there_is_no_request_to_accept');
        break;
      case 'DECLINE': // front-end A token | auth-code
        if (Idocument[1]) {
          Idocument[0] = await findMutualAuthbyId(Idocument[1].sender);
          Gdocument[0] = await findMutualAuthbyId(Idocument[1].receiver);

          // add ids to list
          if (
            !Idocument[0].guests
              .map(el => el._id.toString())
              .includes(Idocument[1].receiver.toString())
          ) {
            await declineMutualRequest(Idocument[1].sender, Idocument[1].receiver);
          } else {
            throw new Error('this_request_already_decline');
          }

          if (
            !Idocument[0].guests
              .map(el => el._id.toString())
              .includes(Idocument[1].sender.toString())
          ) {
            await declineMutualRequest(Idocument[1].receiver, Idocument[1].sender);
          } else {
            throw new Error('this_request_already_decline');
          }

          // send email accept
          await sendEmail(
            {
              Iname: Gdocument[0]._id.accountDetails.username,
              Gname: Idocument[0]._id.accountDetails.username,
              action: 'decline',
            },
            Idocument[0]._id.accountDetails.email,
            TEMPLATES.MUTUAL_AUTH.SEND_REQUEST_MESSAGE
          );
          // remove mutual auth request
          await removeMutualAuthRequest(Idocument[1].sender, Idocument[1].receiver);
        }
        return {
          response: {
            message: 'your_request_has_been_decline_successfully',
            status: 200,
          },
        };
        break;
      case 'CANCEL': // front-end A token
        Idocument[0] = await findMutualAuthbyId(IUser._id);
        Gdocument[0] = await findMutualAuthbyId(GUser._id);

        Idocument[1] = await findMutualAuthRequestbyId(IUser._id, GUser._id);
        // Gdocument[1] = await findMutualAuthRequestbyId(GUser._id._id);

        if (Idocument[1]) {
          Idocument[1] = await declineMutualRequest(IUser._id, GUser._id);
          return {
            response: {
              message: 'your_request_has_been_cancel_successfully',
              status: 200,
            },
          };
        }
        throw new Error('there_is_no_request_to_cancel');
        break;
      case 'REMOVEACCESS': // front-end A token
        Idocument[0] = await findMutualAuthbyId(IUser._id);
        Gdocument[0] = await findMutualAuthbyId(GUser._id);
        if (
          Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
          Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())
        ) {
          await removeMutualAuthAccess(IUser._id, GUser._id);
        }
        return {
          response: {
            message: 'access_removed_successfully',
            status: 200,
          },
        };
        break;
      case 'SENDREQUEST': // front-end A token | auth-code
        // find or create init Mutuak Auth
        Idocument[0] = await findMutualAuthbyId(IUser._id);
        Gdocument[0] = await findMutualAuthbyId(GUser._id);

        Idocument[1] = await findMutualAuthRequestbyId(IUser._id, GUser._id);
        Gdocument[1] = await findMutualAuthRequestbyId(GUser._id, IUser._id);

        if (
          Idocument[1]?.length === 0 &&
          Gdocument[1]?.length === 0 &&
          !Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
          !Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())
        ) {
          Idocument[1] = await createMutualAuthRequestbyId(IUser._id, GUser._id, origin);
          await sendEmail(
            {
              declineLink: `${Idocument[1].origin}/api/mutual-auth/?authCode=${Idocument[1].authCode}`,
              acceptLink: `${Idocument[1].origin}/api/mutual-auth/?authCode=${Idocument[1].authCode}`,
              Gname: IUser.accountDetails.username,
              Iname: GUser.accountDetails.username,
            },
            ownerEmail,
            TEMPLATES.MUTUAL_AUTH.SEND_REQUEST
          );
          return {
            response: {
              message: 'your_request_has_been_sent_successfully',
              status: 200,
            },
          };
        }

        throw new Error('you_already_have_access_request_to_this_account');
        break;

      default:
        break;
    }
  } catch (err) {
    console.log('err.message ', err.message);
    if (
      [
        'request_not_sent',
        'invalid_permissions:invalid_API_key',
        'this_request_already_had_used',
        'emial_not_found',
        'this_request_already_accepted',
        'this_request_already_decline',
        'your_request_has_been_decline_successfully',
        'you_can_not_send_a_request_to_yourself',
        'there_is_no_request_to_cancel',
        'you_already_have_access_request_to_this_account',
        'there_is_no_request_to_accept',
        'you_can_not_accept_or_decline_this_request',
        'you_do_not_have_access_to_this_account',
      ].includes(err.message)
    ) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getMutualAuthsById',
        functionParams: [
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
        ],
        additionalMessage: err.message,
        startLogId,
      });
      return {
        response: {
          message: err.message,
          status: 500,
        },
      };
    }

    switch (err.name) {
      case 'JsonWebTokenError':
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getMutualAuthsById',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: 'User Document Not Found',
          startLogId,
        });
        return {
          response: {
            message: 'invalid_token',
            status: 500,
          },
        };
      default:
        if (err.message.startsWith('Unexpected token')) {
          await createApiLog({
            type: ApiLogTypes.QUERY_END,
            level: ApiLogLevels.ERROR,
            functionName: 'getMutualAuthsById',
            functionParams: [
              {
                paramName: 'token',
                paramValue: 'HIDDEN_TOKEN',
                paramType: typeof token,
              },
            ],
            additionalMessage: 'User Document Not Found',
            startLogId,
          });
          return {
            response: {
              message: 'invalid_token',
              status: 500,
            },
          };
        }
        await createApiLog({
          type: ApiLogTypes.QUERY_END,
          level: ApiLogLevels.ERROR,
          functionName: 'getMutualAuthsById',
          functionParams: [
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
          ],
          additionalMessage: err.message,
          startLogId,
        });
        return {
          response: {
            message: 'server_err',
            status: 500,
          },
        };
    }
  }
}
