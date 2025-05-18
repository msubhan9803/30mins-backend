import { gql } from 'apollo-server-express';
export const types = gql `
  type Charity {
    _id: String
    name: String
    taxID: String
    description: String
    website: String
  }

  type CharityDataResponse {
    response: Response
    charityData: [Charity]
  }
  type CharityPublicDataResponse {
    response: Response
    charityData: [Charity]
    charityCount: Int
  }

  type SingleCharityDataResponse {
    response: Response
    charityData: Charity
  }
`;
//# sourceMappingURL=types.js.map