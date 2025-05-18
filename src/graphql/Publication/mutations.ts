import {gql} from 'apollo-server-express';

export const mutations = gql`
  input PublicationInput {
    headline: String
    url: String
    type: String
    image: String
    description: String
  }

  type Mutation {
    createPublication(publicationData: PublicationInput, token: String!): Response
    editPublication(
      publicationData: PublicationInput
      documentId: String!
      token: String!
    ): Response
    deletePublication(documentId: String!, token: String!): Response
  }
`;
