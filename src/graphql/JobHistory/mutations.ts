import {gql} from 'apollo-server-express';

export const mutations = gql`
  input JobHistoryInput {
    position: String
    company: String
    startDate: String
    endDate: String
    current: Boolean
    roleDescription: String
    employmentType: String
    location: String
  }

  type Mutation {
    createJobHistory(jobHistoryData: JobHistoryInput, token: String!): Response
    editJobHistory(jobHistoryData: JobHistoryInput, documentId: String!, token: String!): Response
    deleteJobHistory(documentId: String!, token: String!): Response
  }
`;
