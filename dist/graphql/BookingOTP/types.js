import { gql } from 'apollo-server-express';
export const types = gql `
  type BookingOTP {
    serviceId: String
    verified: Boolean
    email: String
    otpToken: String
  }
`;
//# sourceMappingURL=types.js.map