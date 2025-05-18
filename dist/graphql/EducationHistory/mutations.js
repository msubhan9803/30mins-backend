import { gql } from 'apollo-server-express';
export const mutations = gql `
  input EducationHistoryInput {
    degree: String
    school: String
    startDate: String
    endDate: String
    current: Boolean
    graduated: Boolean
    additionalInfo: String
    extracurricular: String
    fieldOfStudy: String
  }

  type Mutation {
    createEducationHistory(educationHistoryData: EducationHistoryInput, token: String!): Response
    editEducationHistory(
      educationHistoryData: EducationHistoryInput
      documentId: String!
      token: String!
    ): Response
    deleteEducationHistory(documentId: String!, token: String!): Response
  }
`;
//# sourceMappingURL=mutations.js.map