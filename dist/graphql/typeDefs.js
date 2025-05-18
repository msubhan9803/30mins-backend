import { gql } from 'apollo-server-express';
import { User } from './User';
import { AgendaJobs } from './AgendaJobs';
import { Booking } from './Booking';
import { Charity } from './Charity';
import { CollectiveGroup } from './CollectiveAvailability';
import { Organization } from './Organization';
import { Shared } from './Shared';
import { Integrations } from './Integrations';
import { GoogleCalendar } from './Integrations/GoogleCalendar';
import { Office365Calendar } from './Integrations/Office365Calendar';
import { Zoom } from './Integrations/Zoom';
import { Service } from './Service';
import { Publication } from './Publication';
import { EducationHistory } from './EducationHistory';
import { JobHistory } from './JobHistory';
import { ApiLog } from './ApiLog';
import { ActiveExtension } from './ActiveExtension';
import { StripeAccount } from './StripeAccount';
import { SendMessageExtension } from './SendMessageExtension';
import { HaveAnIdea } from './HaveAnIdea';
import { BlockedDomain } from './BlockedDomain';
import { Sitemap } from './Sitemap';
import { RoundRobinTeam } from './RoundRobin';
import { ChatMessage } from './ChatMessage';
import { Conversation } from './Conversations';
import { AdminCommands } from './AdminCommands';
import { BookingOTP } from './BookingOTP';
import { Statistics } from './Statistics';
import { MutualAuths } from './MutualAuths';
import { Post } from './Post';
import { Event } from './Event';
import { Product } from './Product';
const typeDefs = gql `
  scalar Upload

  enum SERVICE_AUTH_TYPE {
    NONE
    PRE_APPROVED
    VERIFIED_ONLY
  }
  type Response {
    message: String!
    status: Int!
  }
  input PaginationArgs {
    pageNumber: Int!
    resultsPerPage: Int!
  }
  type Media {
    type: String
    link: String
  }

  type SocialsType {
    twitter: String
    instagram: String
    linkedin: String
    facebook: String
    youtube: String
  }

  input SocialsInput {
    twitter: String
    instagram: String
    linkedin: String
    facebook: String
    youtube: String
  }

  input MediaInput {
    type: String
    link: String
  }

  type UploadedFileResponse {
    filename: String
    mimetype: String
    encoding: String
    url: String
  }

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  ${User.types}
  ${Booking.types}
  ${Charity.types}
  ${Organization.types}
  ${Integrations.types}
  ${Service.types}
  ${Publication.types}
  ${EducationHistory.types}
  ${JobHistory.types}
  ${ActiveExtension.types}
  ${BlockedDomain.types}
  ${StripeAccount.types}
  ${CollectiveGroup.types}
  ${Sitemap.types}
  ${RoundRobinTeam.types}
  ${ChatMessage.types}
  ${BookingOTP.types}
  ${Statistics.types}
  ${MutualAuths.types}
  ${Post.types}
  ${Event.types}
  ${Product.types}

  ${User.queries}
  ${Booking.queries}
  ${Charity.queries}
  ${Organization.queries}
  ${Shared.queries}
  ${Integrations.queries}
  ${Service.queries}
  ${Publication.queries}
  ${EducationHistory.queries}
  ${JobHistory.queries}
  ${ApiLog.queries}
  ${ActiveExtension.queries}
  ${BlockedDomain.queries}
  ${StripeAccount.queries}
  ${CollectiveGroup.queries}
  ${Sitemap.queries}
  ${RoundRobinTeam.queries}
  ${Conversation.queries}
  ${ChatMessage.queries}
  ${AdminCommands.queries}
  ${Statistics.queries}
  ${MutualAuths.queries}
  ${Post.queries}
  ${Event.queries}
  ${Product.queries}

  ${User.mutations}
  ${AgendaJobs.mutations}
  ${Booking.mutations}
  ${Charity.mutations}
  ${Organization.mutations}
  ${Shared.mutations}
  ${Integrations.mutations}
  ${GoogleCalendar.mutations}
  ${Office365Calendar.mutations}
  ${Zoom.mutations}
  ${Service.mutations}
  ${Publication.mutations}
  ${EducationHistory.mutations}
  ${JobHistory.mutations}
  ${ApiLog.mutations}
  ${ActiveExtension.mutations}
  ${StripeAccount.mutations}
  ${SendMessageExtension.mutations}
  ${HaveAnIdea.mutations}
  ${BlockedDomain.mutations}
  ${CollectiveGroup.mutations}
  ${RoundRobinTeam.mutations}
  ${ChatMessage.mutations}
  ${Conversation.mutations}
  ${AdminCommands.mutations}
  ${BookingOTP.mutations}
  ${Statistics.mutations}
  ${MutualAuths.mutations}
  ${Post.mutations}
  ${Event.mutations}
  ${Product.mutations}

  ${ChatMessage.subscriptions}
`;
export default typeDefs;
//# sourceMappingURL=typeDefs.js.map