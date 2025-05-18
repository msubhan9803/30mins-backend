export interface StatusUpdateData {
  bookingId: String;
  clientConfirmed: Boolean;
  clientCanceled: Boolean;
  providerCanceled: Boolean;
  providerDeclined: Boolean;
  providerConfirmed: Boolean;
  refundRequested: Boolean;
  refunded: Boolean;
  hasOpenReport: Boolean;
  refundRequestReason: String;
  reportReason: String;
  postMeetingFeedback: String;
  postMeetingNotes: String;
  paymentStatus: String;
  paymentReleased: String;
}
