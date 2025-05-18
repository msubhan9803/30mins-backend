import {gql} from 'apollo-server-express';

export const mutations = gql`
  input BlockedDomainInput {
    domain: String
    blockReason: String
  }

  type Mutation {
    addBlockedDomain(blockedDomainData: BlockedDomainInput!): Response
    deleteBlockedDomain(domain: String!): Response
  }
`;
