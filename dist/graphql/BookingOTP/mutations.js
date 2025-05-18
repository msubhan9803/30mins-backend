import { gql } from 'apollo-server-express';
export const mutations = gql `
  input BookingOTPInput {
    serviceId: String
    verified: Boolean
    email: String
    otpToken: String
  }
  type Mutation {
    generateBookingOTP(serviceId: String, email: String): Response
    resendBookingOTP(serviceId: String, email: String): Response
    verifyBookingOTP(serviceId: String, email: String, otpToken: String): Response
    confirmBookingOTP(serviceId: String, email: String, otpToken: String): Response
  }
`;
//# sourceMappingURL=mutations.js.map