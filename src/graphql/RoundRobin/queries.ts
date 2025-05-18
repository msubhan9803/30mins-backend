import {gql} from 'apollo-server-express';

export const queries = gql`
  type Query {
    """
    Get the round robin team by round robin team
    roundRobinTeamId: String
    return: User Public Data
    """
    getRoundRobinTeamByTeamId(roundRobinTeamId: String!): RoundRobinTeamResponse
    """
    Get the Round Robin Teams by the Organization Id
    OrganizationId:String
    return:User Public Data
    """
    getRoundRobinTeamsByOrganizationId(organizationId: String!): RoundRobinTeamsResponse
  }
`;
