import {gql} from 'apollo-server-express';

export const mutations = gql`
  enum AllowedUploads {
    USER_AVATAR
    PROFILE_BACKGROUND
    EDIT_PUBLICATION_IMAGE
    EDIT_ORGANIZATION_IMAGE
    EDIT_SERVICE_IMAGE
    MARKETER_UPLOAD
    PRODUCT_FILE
    PRODUCT_IMAGE
  }

  enum AllowedDeleteTypes {
    PUBLICATION
    AVATAR
    SERVICE
    ORGANIZATION
  }

  # If no documentId is added, this mutation will only upload the image to the bucket and return a link to the object
  type Mutation {
    singleUpload(
      file: Upload!
      accessToken: String!
      uploadType: AllowedUploads
      documentId: String
    ): Response

    deleteImageForUser(
      imageUrl: String!
      imageType: AllowedDeleteTypes!
      documentId: String
    ): Response
  }
`;
