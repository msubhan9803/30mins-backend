import { gql } from 'apollo-server-express';
export const mutations = gql `
  enum AgendaJobNames {
    send15MinReminder
    send24HrReminder
    send24HrDelayedFreelanceReminder
    send24HrFreelanceReminder
    sendDirectCompleteEmail
    sendEscrowReleaseEmail
    sendFollowUpEmail
    updateSitemaps
    sendAutomaticMeetingComplete
  }

  input ServiceSmsSetting {
    phone: String
    reminders: Boolean
  }
  input SMSSettings {
    bookerSms: ServiceSmsSetting
    providerSms: ServiceSmsSetting
  }

  input JobDataInput {
    title: String
    serviceType: String
    bookingId: String
    bookerName: String
    bookerEmail: String
    bookerTimeZone: String
    bookerLanguage: String
    providerTimeZone: String
    providerName: String
    providerEmail: String
    providerLanguage: String
    bookerPhone: String
    additionalNotes: String
    meetingCount: Int
    price: Int
    currency: String
    paymentType: String
    meetingDate: String
    percentDonated: Int
    charity: String
    conferenceType: String
    conferenceLink: String
    zoomJoinUrl: String
    zoomStartUrl: String
    zoomPassword: String
    startTime: String
    endTime: String
    meetingDuration: Int
    ccRecipients: [String]
    providerId: String
    providerAuthCode: String
    clientAuthCode: String
    smsSettings: SMSSettings
  }

  input AgendaJobDataInput {
    jobName: AgendaJobNames!
    scheduledDate: String!
    jobData: JobDataInput!
  }

  type Mutation {
    scheduleAgendaJob(agendaJobData: AgendaJobDataInput): Response
  }
`;
//# sourceMappingURL=mutations.js.map