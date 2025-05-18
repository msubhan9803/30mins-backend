/* eslint-disable @typescript-eslint/no-unused-vars */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import MutualAuths from '../../../../MongoModels/MutualAuths';
import MutualAuthRequest from '../../../../MongoModels/MutualAuthRequest';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import sendEmail from '../../../../utils/sendEmailHandler';
import TEMPLATES from '../../../../constants/emailTemplateIDs';
function findMutualAuthbyId(_id) {
    return __awaiter(this, void 0, void 0, function* () {
        let document = yield MutualAuths.findById(_id).populate('_id', [
            'accountDetails.email',
            'accountDetails.username',
        ]);
        if (!document) {
            document = yield MutualAuths.create({
                _id: _id,
            });
        }
        return document;
    });
}
function AcceptMutualRequest(_id, guestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield MutualAuths.findByIdAndUpdate(_id, {
            $push: {
                guests: guestId,
            },
        }).then(el => el);
        return document;
    });
}
function findMutualAuthRequestbyId(_id, receiverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield MutualAuthRequest.find({ sender: _id, receiver: receiverId }).then(el => el);
        return document;
    });
}
function removeMutualAuthRequest(_id, guestId) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield MutualAuthRequest.findOneAndDelete({ sender: _id, receiver: guestId }).then(el => el);
        return document;
    });
}
function createMutualAuthRequestbyId(sender, receiver, origin) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield MutualAuthRequest.create({
            sender: sender,
            receiver,
            origin,
            authCode: uuid(),
        }).then(el => el);
        return document;
    });
}
function declineMutualRequest(_id, receiver) {
    return __awaiter(this, void 0, void 0, function* () {
        const document = yield MutualAuthRequest.findOneAndRemove({
            sender: _id,
            receiver,
        }).then(el => el);
        return document;
    });
}
function removeMutualAuthAccess(_id, _id1) {
    return __awaiter(this, void 0, void 0, function* () {
        yield MutualAuths.findByIdAndUpdate(_id.toString(), {
            $pull: {
                guests: _id1,
            },
        });
        yield MutualAuths.findByIdAndUpdate(_id1.toString(), {
            $pull: {
                guests: _id,
            },
        });
    });
}
// eslint-disable-next-line consistent-return
export default function updateMutualAuths(_, { actoin, ownerEmail, origin, token, AuthCode }, context) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        let decodedToken;
        let IUser;
        let GUser;
        const Idocument = [];
        const Gdocument = [];
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        try {
            // find owner
            startLogId = yield createApiLog({
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
                GUser = yield User.findOne({ 'accountDetails.email': ownerEmail })
                    .orFail(() => {
                    throw new Error('emial_not_found');
                })
                    .exec();
                if (IUser._id.toString() === GUser._id.toString()) {
                    throw new Error('you_can_not_send_a_request_to_yourself');
                }
                if (actoin === 'ACCEPT' || actoin === 'DECLINE') {
                    Idocument[1] = yield MutualAuthRequest.findOne({
                        sender: GUser._id,
                        receiver: IUser._id,
                    }).orFail(() => {
                        throw new Error('this_request_already_had_used');
                    });
                    if (Idocument[1].sender.toString() === IUser._id.toString()) {
                        throw new Error('you_can_not_accept_or_decline_this_request');
                    }
                }
            }
            else if (AuthCode) {
                if (context.token !== SECRETS.BACKEND_API_KEY) {
                    throw new Error('invalid_permissions:invalid_API_key');
                }
                Idocument[1] = yield MutualAuthRequest.findOne({ authCode: AuthCode }).orFail(() => {
                    throw new Error('this_request_already_had_used');
                });
            }
            else {
                throw new Error('faild!');
            }
            // find the guest
            switch (actoin) {
                case 'CONNECT': // front-end A token
                    Idocument[0] = yield findMutualAuthbyId(IUser._id);
                    Gdocument[0] = yield findMutualAuthbyId(GUser._id);
                    if (Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
                        Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())) {
                        // eslint-disable-next-line no-case-declarations
                        const newToken = jwt.sign({ UserId: GUser._id }, accessTokenSecret, {
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
                        Idocument[0] = yield findMutualAuthbyId(Idocument[1].sender);
                        Gdocument[0] = yield findMutualAuthbyId(Idocument[1].receiver);
                        if (!Idocument[0].guests
                            .map(el => el._id.toString())
                            .includes(Idocument[1].receiver.toString())) {
                            yield AcceptMutualRequest(Idocument[1].sender, Idocument[1].receiver);
                        }
                        if (!Idocument[0].guests
                            .map(el => el._id.toString())
                            .includes(Idocument[1].sender.toString())) {
                            yield AcceptMutualRequest(Idocument[1].receiver, Idocument[1].sender);
                        }
                        yield sendEmail({
                            Iname: Gdocument[0]._id.accountDetails.username,
                            Gname: Idocument[0]._id.accountDetails.username,
                            action: 'accepted',
                        }, Idocument[0]._id.accountDetails.email, TEMPLATES.MUTUAL_AUTH.SEND_REQUEST_MESSAGE);
                        yield removeMutualAuthRequest(Idocument[1].sender, Idocument[1].receiver);
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
                        Idocument[0] = yield findMutualAuthbyId(Idocument[1].sender);
                        Gdocument[0] = yield findMutualAuthbyId(Idocument[1].receiver);
                        // add ids to list
                        if (!Idocument[0].guests
                            .map(el => el._id.toString())
                            .includes(Idocument[1].receiver.toString())) {
                            yield declineMutualRequest(Idocument[1].sender, Idocument[1].receiver);
                        }
                        else {
                            throw new Error('this_request_already_decline');
                        }
                        if (!Idocument[0].guests
                            .map(el => el._id.toString())
                            .includes(Idocument[1].sender.toString())) {
                            yield declineMutualRequest(Idocument[1].receiver, Idocument[1].sender);
                        }
                        else {
                            throw new Error('this_request_already_decline');
                        }
                        // send email accept
                        yield sendEmail({
                            Iname: Gdocument[0]._id.accountDetails.username,
                            Gname: Idocument[0]._id.accountDetails.username,
                            action: 'decline',
                        }, Idocument[0]._id.accountDetails.email, TEMPLATES.MUTUAL_AUTH.SEND_REQUEST_MESSAGE);
                        // remove mutual auth request
                        yield removeMutualAuthRequest(Idocument[1].sender, Idocument[1].receiver);
                    }
                    return {
                        response: {
                            message: 'your_request_has_been_decline_successfully',
                            status: 200,
                        },
                    };
                    break;
                case 'CANCEL': // front-end A token
                    Idocument[0] = yield findMutualAuthbyId(IUser._id);
                    Gdocument[0] = yield findMutualAuthbyId(GUser._id);
                    Idocument[1] = yield findMutualAuthRequestbyId(IUser._id, GUser._id);
                    // Gdocument[1] = await findMutualAuthRequestbyId(GUser._id._id);
                    if (Idocument[1]) {
                        Idocument[1] = yield declineMutualRequest(IUser._id, GUser._id);
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
                    Idocument[0] = yield findMutualAuthbyId(IUser._id);
                    Gdocument[0] = yield findMutualAuthbyId(GUser._id);
                    if (Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
                        Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())) {
                        yield removeMutualAuthAccess(IUser._id, GUser._id);
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
                    Idocument[0] = yield findMutualAuthbyId(IUser._id);
                    Gdocument[0] = yield findMutualAuthbyId(GUser._id);
                    Idocument[1] = yield findMutualAuthRequestbyId(IUser._id, GUser._id);
                    Gdocument[1] = yield findMutualAuthRequestbyId(GUser._id, IUser._id);
                    if (((_a = Idocument[1]) === null || _a === void 0 ? void 0 : _a.length) === 0 &&
                        ((_b = Gdocument[1]) === null || _b === void 0 ? void 0 : _b.length) === 0 &&
                        !Idocument[0].guests.map(el => el._id.toString()).includes(GUser._id.toString()) &&
                        !Gdocument[0].guests.map(el => el._id.toString()).includes(IUser._id.toString())) {
                        Idocument[1] = yield createMutualAuthRequestbyId(IUser._id, GUser._id, origin);
                        yield sendEmail({
                            declineLink: `${Idocument[1].origin}/api/mutual-auth/?authCode=${Idocument[1].authCode}`,
                            acceptLink: `${Idocument[1].origin}/api/mutual-auth/?authCode=${Idocument[1].authCode}`,
                            Gname: IUser.accountDetails.username,
                            Iname: GUser.accountDetails.username,
                        }, ownerEmail, TEMPLATES.MUTUAL_AUTH.SEND_REQUEST);
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
        }
        catch (err) {
            console.log('err.message ', err.message);
            if ([
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
            ].includes(err.message)) {
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
                                message: 'invalid_token',
                                status: 500,
                            },
                        };
                    }
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
//# sourceMappingURL=updateMutualAuths.js.map