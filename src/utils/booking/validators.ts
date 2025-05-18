import dayjs from 'dayjs';

// meeting

export const canClientCancel = (bookedMeeting, isProvider) =>
  dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
  !bookedMeeting?.status?.providerCanceled &&
  !bookedMeeting?.status?.providerDeclined &&
  !bookedMeeting?.status?.clientCanceled &&
  !bookedMeeting?.status?.providerDeclined &&
  !isProvider;

export const canProviderCancel = (bookedMeeting, isProvider) =>
  dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
  !bookedMeeting?.status?.providerCanceled &&
  !bookedMeeting?.status?.providerDeclined &&
  !bookedMeeting?.status?.clientCanceled &&
  !bookedMeeting?.status?.providerDeclined &&
  isProvider;

export const canDecline = (bookedMeeting, isProvider) =>
  dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
  !bookedMeeting.providerCanceled &&
  !bookedMeeting.clientCanceled &&
  !bookedMeeting.providerDeclined &&
  !bookedMeeting.hasOpenReport &&
  isProvider;

export const canConfirm = (bookedMeeting, isProvider) =>
  dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
  !isProvider &&
  !bookedMeeting.hasOpenReport &&
  !bookedMeeting.clientConfirmed &&
  !bookedMeeting.providerCanceled &&
  !bookedMeeting.providerDeclined &&
  !bookedMeeting.clientCanceled;

export const canComplete = (bookedMeeting, isProvider) =>
  dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
  isProvider &&
  !bookedMeeting?.providerConfirmed &&
  !bookedMeeting?.providerCanceled &&
  !bookedMeeting?.clientCanceled &&
  !bookedMeeting?.providerDeclined;

export const canRefundReport = (bookedMeeting, isProvider) =>
  dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
  !bookedMeeting?.providerConfirmed &&
  !bookedMeeting?.providerCanceled &&
  !bookedMeeting?.clientCanceled &&
  !bookedMeeting?.providerDeclined &&
  bookedMeeting?.price > 0 &&
  !isProvider;

export const canReport = (bookedMeeting, isProvider) =>
  dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
  !bookedMeeting?.providerConfirmed &&
  !bookedMeeting.providerCanceled &&
  !bookedMeeting.clientCanceled &&
  !bookedMeeting.providerDeclined &&
  !isProvider;

// freelance
export const canClientCancelOrder = (
  bookedMeeting,
  isProvider,
  isOneHourPassedSinceBooking,
  isDueDatePassed
) =>
  !isProvider &&
  (isDueDatePassed || !isOneHourPassedSinceBooking) &&
  !bookedMeeting.clientConfirmed &&
  !bookedMeeting.clientCanceled &&
  !bookedMeeting.refundRequested &&
  !bookedMeeting.hasOpenReport;

export const canRequestRefund = (bookedMeeting, isProvider, dueDateUTC) =>
  !isProvider &&
  dayjs().isAfter(dueDateUTC()) &&
  bookedMeeting.price > 0 &&
  !bookedMeeting.clientConfirmed &&
  !bookedMeeting.clientCanceled &&
  !bookedMeeting.refundRequested &&
  !bookedMeeting.hasOpenReport;

export const canClientConfirmOrder = (bookedMeeting, isProvider) =>
  !isProvider &&
  !bookedMeeting.clientConfirmed &&
  !bookedMeeting.clientCanceled &&
  !bookedMeeting.hasOpenReport &&
  !bookedMeeting.refundRequested;

export const canProviderCompleteOrder = (bookedMeeting, isProvider) =>
  isProvider && !bookedMeeting?.providerConfirmed && !bookedMeeting?.providerCanceled;
