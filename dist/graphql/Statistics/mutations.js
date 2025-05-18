import { gql } from 'apollo-server-express';
export const mutations = gql `
  enum BUSSINESS_STATS {
    TOTAL_REVENUE
    TOTAL_MONTHLY_RECURRING_REVENUE
    TOTAL_ANNUALLY_RECURRING_REVENUE
    TOTAL_ORGANIZATION_REVENUE
    TOTAL_ORGANIZATION_MONTHLY_RECURRING_REVENUE
    TOTAL_ORGANIZATION_ANNUALLY_RECURRING_REVENUE
    TOTAL_USERS_SIGNED_UP
    TOTAL_USERS_VERIFIED
    TOTAL_USERS_WELCOME_COMPLETE
    TOTAL_ORGANIZATIONS_SIGNED_UP
  }
  input statsInput {
    fields: Fields
    timeStamp: String
  }
  input Fields {
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
  }
  type Mutation {
    updateGlobalBussinessStats(inputs: statsInput): Response
  }
`;
//# sourceMappingURL=mutations.js.map