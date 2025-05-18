import { gql } from 'apollo-server-express';
export const types = gql `
  type GoogleCredential {
    access_token: String!
    refresh_token: String!
    scope: String!
    token_type: String!
    expiry_date: String!
  }

  type ZoomCredential {
    access_token: String!
    refresh_token: String!
    scope: String!
    token_type: String!
    expires_in: String!
  }

  type Office365Credential {
    access_token: String
    refresh_token: String
    scope: String
    expires_in: String
    ext_expires_in: String
  }

  type GoogleCredentialDocument {
    _id: String
    userId: String
    type: String
    userEmail: String
    credentials: GoogleCredential
    isPrimary: Boolean
    _v: Int
  }

  type ZoomCredentialDocument {
    _id: String
    userId: String
    credentialIdentifier: String
    type: String
    userEmail: String
    credentials: ZoomCredential
    isPrimary: Boolean
  }

  type Office365CredentialDocument {
    _id: String
    userId: String
    type: String
    userEmail: String
    credentials: Office365Credential
    allowedProviders: [String]
    isPrimary: Boolean
    _v: Int
  }

  type CredentialsResponse {
    response: Response
    officeCredentials: [Office365CredentialDocument]
    googleCredentials: [GoogleCredentialDocument]
    zoomCredentials: [ZoomCredentialDocument]
  }

  type CheckCredentialsResponse {
    response: Response
    hasOfficeCredentials: Boolean
    hasGoogleCredentials: Boolean
    hasZoomCredentials: Boolean
  }
`;
//# sourceMappingURL=types.js.map