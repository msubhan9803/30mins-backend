var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Express from 'express';
import allconv from './conversations/allconv';
import createconv from './conversations/createconv';
import createmessage from './messages/createmessage';
import sendmessages from './messages/sendmessages';
import jwt from 'jsonwebtoken';
import AwsSecrets from '../../utils/getAwsSecrets';
const Router = Express.Router();
const AuthToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const accesToken = req.params.token;
    const SECRETS = yield AwsSecrets.getInstance();
    const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
    jwt.verify(accesToken, accessTokenSecret, function (err, decoded) {
        if (typeof accesToken !== 'undefined' && !err) {
            req.user = decoded.UserId;
            const UserIdReq = decoded === null || decoded === void 0 ? void 0 : decoded.UserId;
            if (typeof UserIdReq !== 'undefined') {
                next();
            }
        }
    });
});
Router.get('/api/allconv/:user/:token', AuthToken, allconv);
Router.post('/api/createconv/:token', AuthToken, createconv);
Router.post('/api/createmessage/:token', AuthToken, createmessage);
Router.get('/api/sendmessages/:convid/:userid/:token', AuthToken, sendmessages);
export default Router;
//# sourceMappingURL=index.js.map