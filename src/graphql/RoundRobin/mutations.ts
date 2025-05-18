import {gql} from 'apollo-server-express';

export const mutations = gql`
  input RoundRobinInput {
    name: String
    organizationId: String
    teamMembers: [MemberInput]
  }
  input MemberInput {
    priority: Int
    memberEmail: String
  }
  type Mutation {
    """
    Create the round robin team
     -teamMembers: {priority :number,memberEmail:String }
     -organization :String
     -name :number
    """
    createRoundRobinTeam(roundRobinTeamData: RoundRobinInput): Response
    """
    Create the round robin team
     -teamMembers: {priority :number,memberEmail:String }
     -organization :String
     -name :number
     documentId:the id Of team which is to edit
    """
    editRoundRobinTeam(roundRobinTeamData: RoundRobinInput, documentId: String!): Response
    """
    delete Round robin team
    documentId :String RoundRobin Id
    """
    deleteRoundRobinTeam(documentId: String!, organizationId: String): Response
  }
`;
