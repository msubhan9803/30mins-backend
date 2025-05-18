import {gql} from 'apollo-server-express';

export const types = gql`
  type Group {
    _id: String
    name: String
    ownerID: String
    guestIDs: [CollectiveUser!]
  }
  type CollectiveUser {
    _id: String
    accountDetails: Details
  }
  type Details {
    email: String
  }
  type GroupDataResponse {
    response: Response
    groupData: [Group]
  }

  type SingleGroupDataResponse {
    response: Response
    groupData: Group
  }
  type CollectiveAvailabilityResponse {
    availableTimeSlots: [String]
    response: Response
  }
`;
