import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import Event from '../../../../MongoModels/Event';

export default async function getEventSlug(parent, {slug, token}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;

  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    const slugCheck = await Event.exists({
      userId: decodedToken.UserId,
      serviceSlug: slug,
    });

    return {
      eventSlugCheck: slugCheck,
      message: 'Slug Checked Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return {
        message: 'Not Authenticated',
        status: 401,
      };
    }

    if (err?._message === 'Service validation failed') {
      return {
        message: err.message,
        status: 400,
      };
    }

    return {
      message: err.message,
      status: 500,
    };
  }
}
