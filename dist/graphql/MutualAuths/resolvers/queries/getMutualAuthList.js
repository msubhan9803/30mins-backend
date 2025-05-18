var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MutualAuths from '../../../../MongoModels/MutualAuths';
// import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';
// import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';
const UndelectedIds = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const list = [];
    list.push(id);
    const mutualAuth = yield MutualAuths.findById(id);
    mutualAuth && list.push(...mutualAuth.guests.map(el => el._id));
    const mutualAuthReqInv = yield MutualAuthRequest.find({ sender: id }).select('receiver');
    mutualAuthReqInv.length > 0 && list.push(...mutualAuthReqInv.map(el => el === null || el === void 0 ? void 0 : el.receiver));
    const mutualAuthReqPend = yield MutualAuthRequest.find({ receiver: id }).select('sender');
    mutualAuthReqPend.length > 0 && list.push(...mutualAuthReqPend.map(el => el === null || el === void 0 ? void 0 : el._id));
    return list;
});
// eslint-disable-next-line consistent-return
export default function getMutualAuthList(_, { token, actoin, SearchParams }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        let decodedToken;
        let userCount;
        let IUser;
        try {
            const { keywords, pageNumber, resultsPerPage } = SearchParams;
            startLogId = yield createApiLog({
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
                decodedToken = jwt.verify(token, accessTokenSecret);
                const UserExists = yield User.exists({ _id: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.UserId });
                if (!UserExists) {
                    yield createApiLog({
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
                IUser = yield User.findById(decodedToken.UserId).exec();
            }
            let users;
            const skipCount = pageNumber === 0 ? 0 : pageNumber * resultsPerPage;
            const regexp = new RegExp(`^${keywords}`);
            let baseQuery2 = {};
            if (actoin === 'searchUnauthorizedUser') {
                let baseQuery = {};
                if (keywords) {
                    baseQuery = { $and: [] };
                    const keywordsQuery = { $or: [] };
                    keywordsQuery.$or.push({ 'accountDetails.username': { $regex: regexp, $options: 'i' } });
                    keywordsQuery.$or.push({ 'personalDetails.name': { $regex: regexp, $options: 'i' } });
                    baseQuery.$and.push(keywordsQuery);
                }
                const SelectedIds = yield UndelectedIds(IUser === null || IUser === void 0 ? void 0 : IUser._id);
                let constructedQuery = Object.assign(Object.assign({}, baseQuery), { 'accountDetails.privateAccount': false });
                if ((SelectedIds === null || SelectedIds === void 0 ? void 0 : SelectedIds.length) > 0) {
                    constructedQuery = Object.assign(Object.assign({}, constructedQuery), { _id: { $nin: SelectedIds } });
                }
                userCount = yield User.count(constructedQuery);
                users = yield User.find(constructedQuery)
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
                baseQuery2 = { $or: [] };
                baseQuery2.$or.push({ 'accountDetails.username': { $regex: regexp, $options: 'i' } });
                baseQuery2.$or.push({ 'personalDetails.name': { $regex: regexp, $options: 'i' } });
            }
            switch (actoin) {
                case 'searchUnauthorizedUser':
                    return {
                        response: {
                            message: '',
                            status: 200,
                        },
                        userCount,
                        Data: Boolean(keywords === null || keywords === void 0 ? void 0 : keywords.trim()) === true
                            ? users.map(el => {
                                var _a, _b, _c, _d;
                                return ({
                                    _id: el === null || el === void 0 ? void 0 : el._id,
                                    name: (_a = el === null || el === void 0 ? void 0 : el.personalDetails) === null || _a === void 0 ? void 0 : _a.name,
                                    email: (_b = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _b === void 0 ? void 0 : _b.email,
                                    username: (_c = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _c === void 0 ? void 0 : _c.username,
                                    lastSeen: el === null || el === void 0 ? void 0 : el.lastSeen,
                                    avatar: (_d = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _d === void 0 ? void 0 : _d.avatar,
                                });
                            })
                            : [],
                    };
                    break;
                case 'getAuthorizedUser':
                    users = yield MutualAuths.findOne({ _id: IUser._id }).populate('guests', [
                        'accountDetails.username',
                        'accountDetails.email',
                        'accountDetails.avatar',
                        'personalDetails.name',
                        'lastSeen',
                    ], 'User', baseQuery2);
                    users = (_a = users === null || users === void 0 ? void 0 : users.guests) === null || _a === void 0 ? void 0 : _a.filter(el => el !== null).map(el => {
                        var _a, _b, _c, _d;
                        return ({
                            _id: el === null || el === void 0 ? void 0 : el._id,
                            name: (_a = el === null || el === void 0 ? void 0 : el.personalDetails) === null || _a === void 0 ? void 0 : _a.name,
                            email: (_b = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _b === void 0 ? void 0 : _b.email,
                            username: (_c = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _c === void 0 ? void 0 : _c.username,
                            lastSeen: el === null || el === void 0 ? void 0 : el.lastSeen,
                            avatar: (_d = el === null || el === void 0 ? void 0 : el.accountDetails) === null || _d === void 0 ? void 0 : _d.avatar,
                        });
                    });
                    return {
                        response: {
                            message: '',
                            status: 200,
                        },
                        userCount: users === null || users === void 0 ? void 0 : users.length,
                        Data: users,
                    };
                    break;
                case 'getPendingInvites':
                    if (keywords) {
                        users = yield MutualAuthRequest.find({ receiver: IUser === null || IUser === void 0 ? void 0 : IUser._id })
                            .select('sender')
                            .populate('sender', [
                            'accountDetails.username',
                            'accountDetails.email',
                            'accountDetails.avatar',
                            'personalDetails.name',
                            'lastSeen',
                        ], 'User', baseQuery2);
                    }
                    else {
                        userCount = yield MutualAuthRequest.count({ receiver: IUser === null || IUser === void 0 ? void 0 : IUser._id });
                        users = yield MutualAuthRequest.find({ receiver: IUser === null || IUser === void 0 ? void 0 : IUser._id })
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
                            .map(el => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                            return ({
                                _id: (_a = el === null || el === void 0 ? void 0 : el.sender) === null || _a === void 0 ? void 0 : _a._id,
                                name: (_c = (_b = el === null || el === void 0 ? void 0 : el.sender) === null || _b === void 0 ? void 0 : _b.personalDetails) === null || _c === void 0 ? void 0 : _c.name,
                                email: (_e = (_d = el === null || el === void 0 ? void 0 : el.sender) === null || _d === void 0 ? void 0 : _d.accountDetails) === null || _e === void 0 ? void 0 : _e.email,
                                username: (_g = (_f = el === null || el === void 0 ? void 0 : el.sender) === null || _f === void 0 ? void 0 : _f.accountDetails) === null || _g === void 0 ? void 0 : _g.username,
                                lastSeen: (_h = el === null || el === void 0 ? void 0 : el.sender) === null || _h === void 0 ? void 0 : _h.lastSeen,
                                avatar: (_k = (_j = el === null || el === void 0 ? void 0 : el.sender) === null || _j === void 0 ? void 0 : _j.accountDetails) === null || _k === void 0 ? void 0 : _k.avatar,
                            });
                        }),
                    };
                    break;
                case 'getPendingRequest':
                    if (keywords) {
                        users = yield MutualAuthRequest.find({
                            sender: IUser === null || IUser === void 0 ? void 0 : IUser._id,
                        })
                            .select('receiver')
                            .populate('receiver', [
                            'accountDetails.username',
                            'accountDetails.email',
                            'accountDetails.avatar',
                            'personalDetails.name',
                            'lastSeen',
                        ], 'User', baseQuery2);
                    }
                    else {
                        userCount = yield MutualAuthRequest.count({ sender: IUser === null || IUser === void 0 ? void 0 : IUser._id });
                        users = yield MutualAuthRequest.find({
                            sender: IUser === null || IUser === void 0 ? void 0 : IUser._id,
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
                            .map(el => {
                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                            return ({
                                _id: (_a = el === null || el === void 0 ? void 0 : el.receiver) === null || _a === void 0 ? void 0 : _a._id,
                                name: (_c = (_b = el === null || el === void 0 ? void 0 : el.receiver) === null || _b === void 0 ? void 0 : _b.personalDetails) === null || _c === void 0 ? void 0 : _c.name,
                                email: (_e = (_d = el === null || el === void 0 ? void 0 : el.receiver) === null || _d === void 0 ? void 0 : _d.accountDetails) === null || _e === void 0 ? void 0 : _e.email,
                                username: (_g = (_f = el === null || el === void 0 ? void 0 : el.receiver) === null || _f === void 0 ? void 0 : _f.accountDetails) === null || _g === void 0 ? void 0 : _g.username,
                                lastSeen: (_h = el === null || el === void 0 ? void 0 : el.receiver) === null || _h === void 0 ? void 0 : _h.lastSeen,
                                avatar: (_k = (_j = el === null || el === void 0 ? void 0 : el.receiver) === null || _j === void 0 ? void 0 : _j.accountDetails) === null || _k === void 0 ? void 0 : _k.avatar,
                            });
                        }),
                    };
                    break;
                default:
                    break;
            }
        }
        catch (err) {
            console.log(err.message);
            if ([''].includes(err.message)) {
                yield createApiLog({
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
                    yield createApiLog({
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
                        yield createApiLog({
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
                    yield createApiLog({
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
    });
}
//# sourceMappingURL=getMutualAuthList.js.map