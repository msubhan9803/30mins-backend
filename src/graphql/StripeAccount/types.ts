import {gql} from 'apollo-server-express';

export const types = gql`
  type StripeAccount {
    _id: String
    userId: String
    accountId: String
  }

  type StripeAccountDataResponse {
    response: Response
    stripeAccountData: StripeAccount
  }
`;
