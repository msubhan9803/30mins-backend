import { gql } from 'apollo-server-express';
export const types = gql `
  type RoundRobinTeamResponse {
    roundRobinTeam: RoundRobinTeam
    response: Response
  }
  type RoundRobinTeamsResponse {
    roundRobinTeams: [RoundRobinTeam]
    response: Response
  }
  type RoundRobinTeam {
    _id: String
    name: String
    organizationId: String
    teamMembers: [Member]
  }
  type Member {
    priority: Int
    memberId: UserPublicAccountDetails
  }
`;
//# sourceMappingURL=types.js.map