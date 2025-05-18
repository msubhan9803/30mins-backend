import {gql} from 'apollo-server-express';

export const types = gql`
  type EducationHistory {
    _id: String
    userId: String
    degree: String
    school: String
    startDate: String
    endDate: String
    current: Boolean
    graduated: Boolean
    additionalInfo: String
    extracurricular: String
    fieldOfStudy: String
  }

  type EducationHistoryDataResponse {
    response: Response
    educationHistoryData: EducationHistory
  }

  # Multiple
  type MultiEducationHistoryDataResponse {
    response: Response
    educationHistoryData: [EducationHistory]
  }
`;
