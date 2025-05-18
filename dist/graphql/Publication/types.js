import { gql } from 'apollo-server-express';
export const types = gql `
  type Publication {
    _id: String
    userId: String
    headline: String
    url: String
    type: String
    image: String
    description: String
  }

  type PublicationDataResponse {
    response: Response
    publicationData: Publication
  }

  # Multiple
  type PublicationsDataResponse {
    response: Response
    publicationData: [Publication]
  }
`;
//# sourceMappingURL=types.js.map