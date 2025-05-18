import {gql} from 'apollo-server-express';

export const types = gql`
  type JobHistory {
    _id: String
    userId: String
    position: String
    company: String
    startDate: String
    endDate: String
    current: Boolean
    roleDescription: String
    employmentType: String
    location: String
  }

  type JobHistoryDataResponse {
    response: Response
    jobHistoryData: JobHistory
  }

  # Multiple
  type MultiJobHistoryDataResponse {
    response: Response
    jobHistoryData: [JobHistory]
  }
`;
