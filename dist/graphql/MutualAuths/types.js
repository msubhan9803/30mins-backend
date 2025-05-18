import { gql } from 'apollo-server-express';
export const types = gql `
  type AuthUser {
    _id: String
    name: String
    email: String
    username: String
    lastSeen: String
    avatar: String
  }

  type MutualAuths {
    _id: String
    guests: [AuthUser]
  }

  enum authsActoins {
    CONNECT
    ACCEPT
    DECLINE
    CANCEL
    REMOVEACCESS
    SENDREQUEST
  }

  type MutualAuthRequest {
    _id: String
    receiver: String
    origin: String
    authCode: String
  }

  type MutualAuthsDataResponse {
    response: Response
    userCount: Int
    Data: [AuthUser]
  }
`;
//# sourceMappingURL=types.js.map