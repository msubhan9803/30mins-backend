import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import User from '../../../../MongoModels/User';

export default async function editRoundRobinTeam(
  parent,
  {roundRobinTeamData, documentId},
  context,
  info
) {
  const ENV_VALUES = await AwsSecrets.getInstance();

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  const {token} = context;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'editRoundRobinTeam',
      functionParams: [
        {
          paramName: 'roundRobinTeamData',
          paramValue: roundRobinTeamData,
          paramType: typeof roundRobinTeamData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
    });

    const {name, organizationId, teamMembers} = roundRobinTeamData;
    const hasEditPermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['owner', 'admin']},
    });

    if (!hasEditPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editRoundRobinTeam',
        functionParams: [
          {
            paramName: 'roundRobinTeamData',
            paramValue: roundRobinTeamData,
            paramType: typeof roundRobinTeamData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Not Authenticated: User does not have Edit Permissions',
        startLogId,
      });

      return {
        message: 'Not Authenticated: User does not have Edit Permissions ',
        status: 401,
      };
    }
    const emails = teamMembers.map(m => m.memberEmail);
    const userEmails = await User.find(
      {
        'accountDetails.email': {$in: emails},
      },
      ['_id', 'accountDetails.email']
    );
    for await (const userEmail of userEmails) {
      const isMember = await OrganizationMembership.exists({
        userId: userEmail._id,
        organizationId: organizationId,
      });

      if (!isMember) {
        await createApiLog({
          type: ApiLogTypes.MUTATION_END,
          level: ApiLogLevels.ERROR,
          functionName: 'editRoundRobinTeam',
          functionParams: [
            {
              paramName: 'roundRobinTeamData',
              paramValue: roundRobinTeamData,
              paramType: typeof roundRobinTeamData,
            },
            {
              paramName: 'token',
              paramValue: 'HIDDEN_TOKEN',
              paramType: typeof token,
            },
            {
              paramName: 'userId',
              paramValue: decodedToken.UserId,
              paramType: typeof decodedToken.UserId,
            },
          ],
          additionalMessage: `The User ${userEmail?.accountDetails.email} is not the member of Organization.`,
          startLogId,
        });

        return {
          message: `The User ${userEmail?.accountDetails.email} is not the member of Organization.`,
          status: 400,
        };
      }
    }
    const teamMembersWithId = userEmails.map(u => {
      const member = teamMembers.find(member => member.memberEmail === u.accountDetails.email);
      return {
        priority: member.priority,
        memberId: u._id,
      };
    });

    const updatedRoundRobin = await RoundRobinTeam.findByIdAndUpdate(
      documentId,
      {
        $set: {
          name,
          organizationId,
          teamMembers: teamMembersWithId,
        },
      },
      {runValidators: true}
    )
      .orFail(() => new Error('Document Not Found'))
      .exec();

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'editRoundRobinTeam',
      functionParams: [
        {
          paramName: 'roundRobinTeamData',
          paramValue: roundRobinTeamData,
          paramType: typeof roundRobinTeamData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: 'Updated RoundRobinTeam Successfully',
      startLogId,
    });

    return {
      message: 'Updated RoundRobinTeam Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editRoundRobinTeam',
        functionParams: [
          {
            paramName: 'roundRobinTeamData',
            paramValue: roundRobinTeamData,
            paramType: typeof roundRobinTeamData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
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

    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    if (err?._message === 'RoundRobinTeam validation failed') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'editRoundRobinTeam',
        functionParams: [
          {
            paramName: 'roundRobinTeamData',
            paramValue: roundRobinTeamData,
            paramType: typeof roundRobinTeamData,
          },
          {
            paramName: 'documentId',
            paramValue: documentId,
            paramType: typeof documentId,
          },
          {
            paramName: 'token',
            paramValue: 'HIDDEN_TOKEN',
            paramType: typeof token,
          },
          {
            paramName: 'userId',
            paramValue: decodedToken.UserId,
            paramType: typeof decodedToken.UserId,
          },
        ],
        additionalMessage: 'Mongoose RoundRobinTeam Validation Failed',
        startLogId,
      });

      return {
        message: err.message,
        status: 400,
      };
    }

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.ERROR,
      functionName: 'editRoundRobinTeam',
      functionParams: [
        {
          paramName: 'roundRobinTeamData',
          paramValue: roundRobinTeamData,
          paramType: typeof roundRobinTeamData,
        },
        {
          paramName: 'documentId',
          paramValue: documentId,
          paramType: typeof documentId,
        },
        {
          paramName: 'token',
          paramValue: 'HIDDEN_TOKEN',
          paramType: typeof token,
        },
        {
          paramName: 'userId',
          paramValue: decodedToken.UserId,
          paramType: typeof decodedToken.UserId,
        },
      ],
      additionalMessage: err.message,
      startLogId,
    });

    return {
      message: err.message,
      status: 500,
    };
  }
}
