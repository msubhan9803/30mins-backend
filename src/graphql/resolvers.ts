import {GraphQLUpload} from 'graphql-upload';

import {User} from './User';
import {AgendaJobs} from './AgendaJobs';
import {Booking} from './Booking';
import {Charity} from './Charity';
import {Organization} from './Organization';
import {Shared} from './Shared';
import {Integrations} from './Integrations';
import {GoogleCalendar} from './Integrations/GoogleCalendar';
import {Office365Calendar} from './Integrations/Office365Calendar';
import {Zoom} from './Integrations/Zoom';
import {StripeAccount} from './StripeAccount';
import {Service} from './Service';
import {Publication} from './Publication';
import {EducationHistory} from './EducationHistory';
import {JobHistory} from './JobHistory';
import {ApiLog} from './ApiLog';
import {ActiveExtension} from './ActiveExtension';
import {SendMessageExtension} from './SendMessageExtension';
import {HaveAnIdea} from './HaveAnIdea';
import {BlockedDomain} from './BlockedDomain';
import {CollectiveGroup} from './CollectiveAvailability';
import {Sitemap} from './Sitemap';
import {MutualAuths} from './MutualAuths';
import {RoundRobinTeam} from './RoundRobin';
import {ChatMessage} from './ChatMessage';
import {Conversation} from './Conversations';
import {AdminCommands} from './AdminCommands';
import {BookingOTP} from './BookingOTP';
import {Statistics} from './Statistics';
import {Post} from './Post';
import {Event} from './Event';
import {Product} from './Product';

const resolvers = {
  Upload: GraphQLUpload,

  Query: {
    ...User.resolvers.queries,
    ...Booking.resolvers.queries,
    ...Charity.resolvers.queries,
    ...Organization.resolvers.queries,
    ...Shared.resolvers.queries,
    ...Integrations.resolvers.queries,
    ...Service.resolvers.queries,
    ...Publication.resolvers.queries,
    ...EducationHistory.resolvers.queries,
    ...JobHistory.resolvers.queries,
    ...ApiLog.resolvers.queries,
    ...ActiveExtension.resolvers.queries,
    ...BlockedDomain.resolvers.queries,
    ...StripeAccount.resolvers.queries,
    ...CollectiveGroup.resolvers.queries,
    ...Sitemap.resolvers.queries,
    ...RoundRobinTeam.resolvers.queries,
    ...Conversation.resolvers.queries,
    ...ChatMessage.resolvers.queries,
    ...AdminCommands.resolvers.queries,
    ...Statistics.resolvers.queries,
    ...MutualAuths.resolvers.queries,
    ...Post.resolvers.queries,
    ...Event.resolvers.queries,
    ...Product.resolvers.queries,
  },
  Mutation: {
    ...User.resolvers.mutations,
    ...AgendaJobs.resolvers.mutations,
    ...Booking.resolvers.mutations,
    ...Charity.resolvers.mutations,
    ...Organization.resolvers.mutations,
    ...Shared.resolvers.mutations,
    ...Integrations.resolvers.mutations,
    ...GoogleCalendar.resolvers.mutations,
    ...Office365Calendar.resolvers.mutations,
    ...Zoom.resolvers.mutations,
    ...Service.resolvers.mutations,
    ...Publication.resolvers.mutations,
    ...EducationHistory.resolvers.mutations,
    ...JobHistory.resolvers.mutations,
    ...ApiLog.resolvers.mutations,
    ...ActiveExtension.resolvers.mutations,
    ...StripeAccount.resolvers.mutations,
    ...SendMessageExtension.resolvers.mutations,
    ...HaveAnIdea.resolvers.mutations,
    ...BlockedDomain.resolvers.mutations,
    ...CollectiveGroup.resolvers.mutations,
    ...RoundRobinTeam.resolvers.mutations,
    ...ChatMessage.resolvers.mutations,
    ...Conversation.resolvers.mutations,
    ...AdminCommands.resolvers.mutations,
    ...BookingOTP.resolvers.mutations,
    ...Statistics.resolvers.mutations,
    ...MutualAuths.resolvers.mutations,
    ...Post.resolvers.mutations,
    ...Event.resolvers.mutations,
    ...Product.resolvers.mutations,
  },
  Subscription: {
    ...ChatMessage.resolvers.subscriptions,
  },
};

export default resolvers;
