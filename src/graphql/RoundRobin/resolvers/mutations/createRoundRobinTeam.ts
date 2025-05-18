import RoundRobinTeam from '../../../../MongoModels/RoundRobinTeam';
import jwt from 'jsonwebtoken';
import {AccessToken} from '../../../../constants/types';
import createApiLog, {ApiLogLevels, ApiLogTypes} from '../../../../utils/createApiLog';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import User from '../../../../MongoModels/User';
import OrganizationMembership from '../../../../MongoModels/OrganizationMembership';

export default async function createRoundRobinTeam(parent, {roundRobinTeamData}, context, info) {
  const ENV_VALUES = await AwsSecrets.getInstance();
  const {token} = context;

  const accessTokenSecret = ENV_VALUES.JWT_ACCESS_TOKEN_SECRET;
  let startLogId: String;
  try {
    const decodedToken = jwt.verify(token, accessTokenSecret) as unknown as AccessToken;

    startLogId = await createApiLog({
      type: ApiLogTypes.MUTATION_START,
      level: ApiLogLevels.INFO,
      functionName: 'createRoundRobinTeam',
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
    });

    const hasExtension = await ActiveExtension.exists({
      userId: decodedToken.UserId,
      extensionProductId: {
        $in: [
          stripeProductIDs.EXTENSIONS.ORGANIZATIONS,
          stripeProductIDs.EXTENSIONS.ORGANIZATIONS_ANNUAL,
        ],
      },
      status: {
        $in: ['paid', 'gifted'],
      },
    });

    if (!hasExtension) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createRoundRobinTeam',
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
        additionalMessage: 'User does not have the Organization Extension ',
        startLogId,
      });

      return {
        message: 'User does not have the Organization Extension',
        status: 400,
      };
    }

    const {name, organizationId, teamMembers} = roundRobinTeamData;

    const hasPermission = await OrganizationMembership.exists({
      userId: decodedToken.UserId,
      organizationId: organizationId,
      role: {$in: ['owner', 'admin']},
    });
    if (!hasPermission) {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'deleteRoundRobinTeam',
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
        additionalMessage: 'Not Authenticated:  The user does not have the delete permission',
        startLogId,
      });

      return {
        message: 'Not Authenticated: The user does not have the delete permission',
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
          functionName: 'createRoundRobinTeam',
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

    const createdRoundRobinTeam = await RoundRobinTeam.create({
      name,
      organizationId,
      teamMembers: teamMembersWithId,
    });

    await createApiLog({
      type: ApiLogTypes.MUTATION_END,
      level: ApiLogLevels.INFO,
      functionName: 'createRoundRobinTeam',
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
      additionalMessage: 'Round Robin Team is created Successfully',
      startLogId,
    });

    return {
      message: 'Created Round Robin Team Successfully',
      status: 200,
    };
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      await createApiLog({
        type: ApiLogTypes.MUTATION_END,
        level: ApiLogLevels.ERROR,
        functionName: 'createRoundRobinTeam',
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
        functionName: 'createRoundRobinTeam',
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
        ],
        additionalMessage: 'Invalid Permissions: Invalid JWT Token',
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
      functionName: 'createRoundRobinTeam',
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
