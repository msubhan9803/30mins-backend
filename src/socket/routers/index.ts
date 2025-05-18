import Express, {Request} from 'express';
import allconv from './conversations/allconv';
import createconv from './conversations/createconv';

import createmessage from './messages/createmessage';
import sendmessages from './messages/sendmessages';

import jwt from 'jsonwebtoken';
import AwsSecrets from '../../utils/getAwsSecrets';

const Router = Express.Router();

export interface IGetUserAuthInfoRequest extends Request {
  user: string;
}
interface decoded {
  UserId: string | undefined;
}

const AuthToken = async (req: IGetUserAuthInfoRequest, res: Express.Response, next: any) => {
  const accesToken = req.params.token;
  const SECRETS = await AwsSecrets.getInstance();
  const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
  jwt.verify(accesToken, accessTokenSecret, function (err: any, decoded: decoded) {
    if (typeof accesToken !== 'undefined' && !err) {
      req.user = decoded.UserId;
      const UserIdReq: string = decoded?.UserId;
      if (typeof UserIdReq !== 'undefined') {
        next();
      }
    }
  });
};



Router.get('/api/allconv/:user/:token', AuthToken, allconv);
Router.post('/api/createconv/:token', AuthToken, createconv);

Router.post('/api/createmessage/:token', AuthToken, createmessage);
Router.get('/api/sendmessages/:convid/:userid/:token', AuthToken, sendmessages);

export default Router;
