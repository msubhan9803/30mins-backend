import {gql} from 'apollo-server-express';

export const queries = gql`
  input AdminServiceSearchParams {
    keywords: String
    isOrgService: Boolean
    pageNumber: Int!
    resultsPerPage: Int!
  }

  input BackendServiceSearchParams {
    keywords: String
  }

  type UserAccountDetailsForServiceSeo {
    username: String
  }

  type UserForServiceSeo {
    accountDetails: UserAccountDetailsForServiceSeo
  }

  type ServiceForSeo {
    title: String
    slug: String
    description: String
    userId: UserForServiceSeo
  }

  type ServiceSeoResponse {
    serviceData: [ServiceForSeo]
    serviceCount: Int
    response: Response
  }
  type ServiceSlugResponse {
    serviceSlugCheck: Boolean
    response: Response
  }
  type ServiceCharityResponse {
    charities: [Charity]
    response: Response
  }
  type ServiceCountData {
    response: Response
    serviceFreeCount: Int
    servicePaidCount: Int
  }
  type RoundRobinServiceResponse {
    roundRobinService: RoundRobinService
    response: Response
  }
  type RoundRobinServicesResponse {
    roundRobinServices: [RoundRobinService]
    response: Response
  }
  type serviceCountRRResponse {
    serviceCount: Int
    response: Response
  }
  type Query {
    getServiceById(documentId: String!, token: String!): ServiceDataResponse
    getServicesByUserId(token: String!): ServicesDataResponse
    getServiceCount(token: String!): ServiceCountData
    getServicesForAdmin(
      serviceSearchParams: AdminServiceSearchParams
      token: String!
    ): AdminServicesDataResponse
    getServicesForBackend(
      serviceSearchParams: BackendServiceSearchParams
    ): AdminServicesDataResponse
    getServicesForSeo(resultsPerBatch: Int!, batchNumber: Int!): ServiceSeoResponse
    getOrgRoundRobinService(serviceId: String): RoundRobinServiceResponse
    getOrgRoundRobinServices(organizationId: String): RoundRobinServicesResponse
    getServiceCountWithRRId(roundRobinTeamId: String): serviceCountRRResponse
    getServiceSlug(token: String, slug: String!): ServiceSlugResponse
    getServiceCharity(charityQuery: String!): ServiceCharityResponse
  }
`;
