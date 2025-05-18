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
import User from '../../../../MongoModels/User';
import AwsSecrets from '../../../../utils/getAwsSecrets';
export default function getLastSeenOfUser(parent, { email }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const ENV_VALUES = yield AwsSecrets.getInstance();
        const { token } = context;
        const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
        const decodedToken = jwt.verify(token, accessTokenSecret);
        try {
            const user = yield User.findOne({ 'accountDetails.email': email }, [
                'lastSeen',
                'accountDetails',
            ]);
            let online = false;
            if (new Date().getTime() / 1000 - new Date(user === null || user === void 0 ? void 0 : user.lastSeen).getTime() / 1000 <= 60) {
                online = true;
            }
            return {
                lastSeen: user === null || user === void 0 ? void 0 : user.lastSeen,
                accountDetails: user === null || user === void 0 ? void 0 : user.accountDetails,
                online: online,
                response: {
                    message: 'Successfully recieved the last Seen!',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                return {
                    response: {
                        message: err.message,
                        status: 500,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getLastSeenOfUser.js.map