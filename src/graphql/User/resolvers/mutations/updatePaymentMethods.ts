import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import Service from '../../../../MongoModels/Service';
import User from '../../../../MongoModels/User';

export default async function updatePaymentMethods(parent, {direct, escrow}, context) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  let startLogId: String = '';
  const {token} = context;
  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let decodedToken;
  let userId = '';
  let functionParams = [];

  try {
    decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;
    userId = decodedToken.UserId;
    functionParams = [
      {paramName: 'direct', paramValue: direct, paramType: typeof direct},
      {paramName: 'escrow', paramValue: escrow, paramType: typeof escrow},
      {
        paramName: 'userId',
        paramValue: userId,
        paramType: typeof userId,
      },
    ];
    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'updatePaymentMethods',
      functionParams: functionParams,
    });

    const filteredEscrow = escrow?.filter(el => !!el);
    const filteredDirect = direct?.filter(el => !!el);
    console.log(filteredEscrow);

    if (!filteredEscrow?.length || filteredEscrow.includes('none')) {
      await Service.updateMany({userId, paymentType: 'escrow'}, {$set: {paymentType: 'manual'}});
    }

    if (!filteredDirect?.length || filteredDirect.includes('none')) {
      await Service.updateMany({userId, paymentType: 'direct'}, {$set: {paymentType: 'manual'}});
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        'accountDetails.paymentAccounts.escrow': filteredEscrow,
        'accountDetails.paymentAccounts.direct': filteredDirect,
      },
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updatePaymentMethods',
      functionParams: functionParams,
      additionalMessage: `Updated Payment Methods Successfully`,
      startLogId,
    });

    return {
      message: 'Updated Payment Methods Successfully',
      status: 200,
    };
  } catch (err) {
    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'updatePaymentMethods',
      functionParams,
      additionalMessage: err.message,
      startLogId,
    });

    console.log(err.message);

    return {
      message: 'Unknown Error',
      status: 500,
    };
  }
}
