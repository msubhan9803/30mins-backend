import Post from '../../../../MongoModels/Post';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';

export default async function getPostsByUserId(parent, {userId, offset, limit}) {
  let startLogId: String;

  try {
    startLogId = await createApiLog({
      type: ApiLogTypes.QUERY_START,
      level: ApiLogLevels.INFO,
      functionName: 'getPostsByUserId',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
        },
      ],
    });

    let posts = await Post.find({
      userId: userId,
    }).sort({createdAt: -1});
    const recordsTotalCount = posts.length;

    if (offset !== null && limit !== null) {
      posts = posts.slice(offset, limit + offset);
    }

    if (posts.length === 0) {
      await createApiLog({
        type: ApiLogTypes.QUERY_END,
        level: ApiLogLevels.INFO,
        functionName: 'getPostsByUserId',
        functionParams: [
          {
            paramName: 'userId',
            paramValue: userId,
            paramType: typeof userId,
          },
        ],
        additionalMessage: 'No Documents Found',
        startLogId,
      });

      return {
        response: {
          message: 'No Documents Found',
          status: 404,
        },
      };
    }

    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.INFO,
      functionName: 'getPostsByUserId',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
        },
      ],
      additionalMessage: 'Post Query Successful',
      startLogId,
    });

    return {
      postData: posts,
      response: {
        message: 'Post Query Successful',
        status: 200,
      },
      recordsTotalCount,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.QUERY_END,
      level: ApiLogLevels.ERROR,
      functionName: 'getPostsByUserId',
      functionParams: [
        {
          paramName: 'userId',
          paramValue: userId,
          paramType: typeof userId,
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
}
