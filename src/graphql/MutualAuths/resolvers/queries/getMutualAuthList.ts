import MutualAuths from '../../../../MongoModels/MutualAuths';
// import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';
// import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import {AccessToken} from '../../../../constants/types';
import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';

type IProps = {
  token: string;
  actoin?:
    | 'searchUnauthorizedUser'
    | 'getAuthorizedUser'
    | 'getPendingInvites'
    | 'getPendingRequest';
  SearchParams: {
    keywords: string;
    pageNumber: number;
    resultsPerPage: number;
  };
};

const UndelectedIds = async id => {
  const list: Array<any> = [];
  list.push(id);
  const mutualAuth = await MutualAuths.findById(id);
  mutualAuth && list.push(...mutualAuth.guests.map(el => el._id));

  const mutualAuthReqInv = await MutualAuthRequest.find({sender: id}).select('receiver');
  mutualAuthReqInv.length > 0 && list.push(...mutualAuthReqInv.map(el => el?.receiver));

  const mutualAuthReqPend = await MutualAuthRequest.find({receiver: id}).select('sender');
  mutualAuthReqPend.length > 0 && list.push(...mutualAuthReqPend.map(el => el?._id));
  return list;
};

// eslint-disable-next-line consistent-return
export default async function getMutualAuthList(_, {token, actoin, SearchParams}: IProps) {
  let startLogId;
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  let decodedToken;
  let userCount: number;
  let IUser;
  try {
    const {keywords, pageNumber, resultsPerPage} = SearchParams;

    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getMutualAuthList',
      functionParams: [
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'SearchParams',
          paramValue: SearchParams,
          paramType: typeof SearchParams,
        },
        {
          paramName: 'actoin',
          paramValue: actoin,
          paramType: typeof actoin,
        },
      ],
    });

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
    }
    let users;
    const skipCount = pageNumber === 0 ? 0 : pageNumber * resultsPerPage;
    const regexp = new RegExp(`^${keywords}`);
    let baseQuery2: any = {};
    if (actoin === 'searchUnauthorizedUser') {
      let baseQuery: any = {};
      if (keywords) {
        baseQuery = {$and: []};
        const keywordsQuery = {$or: []};
        keywordsQuery.$or.push({'accountDetails.username': {$regex: regexp, $options: 'i'}});
        keywordsQuery.$or.push({'personalDetails.name': {$regex: regexp, $options: 'i'}});
        baseQuery.$and.push(keywordsQuery);
      }

      const SelectedIds = await UndelectedIds(IUser?._id);

      let constructedQuery = {
        ...baseQuery,
        'accountDetails.privateAccount': false,
      };

      if (SelectedIds?.length > 0) {
        constructedQuery = {
          ...constructedQuery,
          _id: {$nin: SelectedIds},
        };
      }
      userCount = await User.count(constructedQuery);

      users = await User.find(constructedQuery)
        .skip(skipCount)
        .limit(resultsPerPage)
        .select([
          'accountDetails.username',
          'accountDetails.email',
          'accountDetails.avatar',
          'personalDetails.name',
          'lastSeen',
        ])
        .exec();
    }

    if (keywords) {
      baseQuery2 = {$or: []};
      baseQuery2.$or.push({'accountDetails.username': {$regex: regexp, $options: 'i'}});
      baseQuery2.$or.push({'personalDetails.name': {$regex: regexp, $options: 'i'}});
    }

    switch (actoin) {
      case 'searchUnauthorizedUser':
        return {
          response: {
            message: '',
            status: 200,
          },
          userCount,
          Data:
            Boolean(keywords?.trim()) === true
              ? users.map(el => ({
                  _id: el?._id,
                  name: el?.personalDetails?.name,
                  email: el?.accountDetails?.email,
                  username: el?.accountDetails?.username,
                  lastSeen: el?.lastSeen,
                  avatar: el?.accountDetails?.avatar,
                }))
              : [],
        };
        break;

      case 'getAuthorizedUser':
        users = await MutualAuths.findOne({_id: IUser._id}).populate(
          'guests',
          [
            'accountDetails.username',
            'accountDetails.email',
            'accountDetails.avatar',
            'personalDetails.name',
            'lastSeen',
          ],
          'User',
          baseQuery2
        );
        users = users?.guests
          ?.filter(el => el !== null)
          .map(el => ({
            _id: el?._id,
            name: el?.personalDetails?.name,
            email: el?.accountDetails?.email,
            username: el?.accountDetails?.username,
            lastSeen: el?.lastSeen,
            avatar: el?.accountDetails?.avatar,
          }));
        return {
          response: {
            message: '',
            status: 200,
          },
          userCount: users?.length,
          Data: users,
        };
        break;

      case 'getPendingInvites':
        if (keywords) {
          users = await MutualAuthRequest.find({receiver: IUser?._id})
            .select('sender')
            .populate(
              'sender',
              [
                'accountDetails.username',
                'accountDetails.email',
                'accountDetails.avatar',
                'personalDetails.name',
                'lastSeen',
              ],
              'User',
              baseQuery2
            );
        } else {
          userCount = await MutualAuthRequest.count({receiver: IUser?._id});
          users = await MutualAuthRequest.find({receiver: IUser?._id})
            .limit(resultsPerPage)
            .skip(skipCount)
            .select('sender')
            .populate('sender', [
              'accountDetails.username',
              'accountDetails.email',
              'accountDetails.avatar',
              'personalDetails.name',
              'lastSeen',
            ]);
        }

        return {
          response: {
            message: '',
            status: 200,
          },
          userCount,
          Data: users
            .filter(el => el.sender !== null)
            .map(el => ({
              _id: el?.sender?._id,
              name: el?.sender?.personalDetails?.name,
              email: el?.sender?.accountDetails?.email,
              username: el?.sender?.accountDetails?.username,
              lastSeen: el?.sender?.lastSeen,
              avatar: el?.sender?.accountDetails?.avatar,
            })),
        };
        break;
      case 'getPendingRequest':
        if (keywords) {
          users = await MutualAuthRequest.find({
            sender: IUser?._id,
          })
            .select('receiver')
            .populate(
              'receiver',
              [
                'accountDetails.username',
                'accountDetails.email',
                'accountDetails.avatar',
                'personalDetails.name',
                'lastSeen',
              ],
              'User',
              baseQuery2
            );
        } else {
          userCount = await MutualAuthRequest.count({sender: IUser?._id});
          users = await MutualAuthRequest.find({
            sender: IUser?._id,
          })
            .limit(resultsPerPage)
            .skip(skipCount)
            .select('receiver')
            .populate('receiver', [
              'accountDetails.username',
              'accountDetails.email',
              'accountDetails.avatar',
              'personalDetails.name',
              'lastSeen',
            ]);
        }
        return {
          response: {
            message: '',
            status: 200,
          },
          userCount,
          Data: users
            .filter(el => el.receiver !== null)
            .map(el => ({
              _id: el?.receiver?._id,
              name: el?.receiver?.personalDetails?.name,
              email: el?.receiver?.accountDetails?.email,
              username: el?.receiver?.accountDetails?.username,
              lastSeen: el?.receiver?.lastSeen,
              avatar: el?.receiver?.accountDetails?.avatar,
            })),
        };
        break;

      default:
        break;
    }
  } catch (err) {
    console.log(err.message);

    if ([''].includes(err.message)) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.ERROR,
        functionName: 'getMutualAuthList',
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
          functionName: 'getMutualAuthList',
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
            functionName: 'getMutualAuthList',
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
          functionName: 'getMutualAuthList',
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
