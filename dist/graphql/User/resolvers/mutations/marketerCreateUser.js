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
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import cuid from 'cuid';
import escapeStringRegexp from 'escape-string-regexp';
export default function marketerCreateUser(parent, { userData }, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.MUTATION_START,
                level: ApiLogLevels.INFO,
                functionName: 'marketerCreateUser',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userData',
                        paramValue: userData,
                        paramType: typeof userData,
                    },
                ],
            });
            const marketingUser = yield User.findOne({
                _id: decodedToken.UserId,
                isMarketer: true,
            });
            if (!marketingUser) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateUser',
                    functionParams: [
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                        {
                            paramName: 'userData',
                            paramValue: userData,
                            paramType: typeof userData,
                        },
                    ],
                    additionalMessage: 'Not Authenticated: User Lacks Marketer Permissions',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            const safeUsername = escapeStringRegexp(userData.accountDetails.username);
            const pattern = `^${safeUsername}$`;
            const regex = new RegExp(pattern, 'i');
            const dupeUsername = yield User.findOne({ 'accountDetails.username': { $regex: regex } }, '_id accountDetails.username');
            if (dupeUsername) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Username Already Exists',
                    startLogId,
                });
                return {
                    message: 'Username Already Exists',
                    status: 409,
                };
            }
            const safeEmail = escapeStringRegexp(userData.accountDetails.email);
            const emailPattern = `^${safeEmail}$`;
            const emailRegex = new RegExp(emailPattern, 'i');
            const dupeEmail = yield User.findOne({ 'accountDetails.email': { $regex: emailRegex } }, '_id accountDetails.email');
            if (dupeEmail) {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateUser',
                    functionParams: [
                        { paramName: 'userData', paramValue: userData, paramType: typeof userData },
                        {
                            paramName: 'marketerId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Email Already Exists',
                    startLogId,
                });
                return {
                    message: 'Email Already Exists',
                    status: 409,
                };
            }
            yield User.create({
                'personalDetails.name': (_a = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _a === void 0 ? void 0 : _a.name,
                'personalDetails.headline': (_b = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _b === void 0 ? void 0 : _b.headline,
                'personalDetails.description': (_c = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _c === void 0 ? void 0 : _c.description,
                'accountDetails.avatar': (_d = userData === null || userData === void 0 ? void 0 : userData.accountDetails) === null || _d === void 0 ? void 0 : _d.avatar,
                'accountDetails.email': (_e = userData === null || userData === void 0 ? void 0 : userData.accountDetails) === null || _e === void 0 ? void 0 : _e.email,
                'accountDetails.username': (_f = userData === null || userData === void 0 ? void 0 : userData.accountDetails) === null || _f === void 0 ? void 0 : _f.username,
                'locationDetails.country': (_g = userData === null || userData === void 0 ? void 0 : userData.locationDetails) === null || _g === void 0 ? void 0 : _g.country,
                'locationDetails.zipCode': (_h = userData === null || userData === void 0 ? void 0 : userData.locationDetails) === null || _h === void 0 ? void 0 : _h.zipCode,
                'personalDetails.socials.linkedin': (_k = (_j = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _j === void 0 ? void 0 : _j.socials) === null || _k === void 0 ? void 0 : _k.linkedin,
                'personalDetails.socials.twitter': (_m = (_l = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _l === void 0 ? void 0 : _l.socials) === null || _m === void 0 ? void 0 : _m.twitter,
                'personalDetails.socials.instagram': (_p = (_o = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _o === void 0 ? void 0 : _o.socials) === null || _p === void 0 ? void 0 : _p.instagram,
                'personalDetails.socials.facebook': (_r = (_q = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _q === void 0 ? void 0 : _q.socials) === null || _r === void 0 ? void 0 : _r.facebook,
                'personalDetails.socials.youtube': (_t = (_s = userData === null || userData === void 0 ? void 0 : userData.personalDetails) === null || _s === void 0 ? void 0 : _s.socials) === null || _t === void 0 ? void 0 : _t.youtube,
                'locationDetails.timezone': (_u = userData === null || userData === void 0 ? void 0 : userData.locationDetails) === null || _u === void 0 ? void 0 : _u.timezone,
                createdBy: decodedToken.UserId,
                affiliateTeamCreatedBy: (marketingUser === null || marketingUser === void 0 ? void 0 : marketingUser.affiliateTeam) || '',
                couponCode: cuid.slug(),
            });
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.INFO,
                functionName: 'marketerCreateUser',
                functionParams: [
                    {
                        paramName: 'marketerId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'userData',
                        paramValue: userData,
                        paramType: typeof userData,
                    },
                ],
                additionalMessage: 'User Created Successfully',
                startLogId,
            });
            return {
                message: 'User Created Successfully',
                status: 200,
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.MUTATION_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'marketerCreateUser',
                    functionParams: [
                        {
                            paramName: 'userData',
                            paramValue: userData,
                            paramType: typeof userData,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    message: 'Not Authenticated',
                    status: 401,
                };
            }
            yield createApiLog({
                type: ApiLogTypes.MUTATION_END,
                level: ApiLogLevels.ERROR,
                functionName: 'marketerCreateUser',
                functionParams: [
                    {
                        paramName: 'userData',
                        paramValue: userData,
                        paramType: typeof userData,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            console.log(err);
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=marketerCreateUser.js.map