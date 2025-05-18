import {gql} from 'apollo-server-express';

export const types = gql`
  type GlobalBussiness {
    totalRevenue: Int
    totalMonthlyRecurringRevenue: Int
    totalAnnualRecurringRevenue: Int
    totalOrganizationRevenue: Int
    totalOrganizationMonthlyRecurringRevenue: Int
    totalOragnizationAnnualRecurringRevenue: Int
    totalUsersSignedUp: Int
    totalUsersVerified: Int
    totalUsersWelcomeComplete: Int
    totalOrganizationsSignedUp: Int
    timeStamp: String
  }
`;
