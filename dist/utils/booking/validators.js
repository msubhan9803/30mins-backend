import dayjs from 'dayjs';
// meeting
export const canClientCancel = (bookedMeeting, isProvider) => {
    var _a, _b, _c, _d;
    return dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
        !((_a = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _a === void 0 ? void 0 : _a.providerCanceled) &&
        !((_b = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _b === void 0 ? void 0 : _b.providerDeclined) &&
        !((_c = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _c === void 0 ? void 0 : _c.clientCanceled) &&
        !((_d = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _d === void 0 ? void 0 : _d.providerDeclined) &&
        !isProvider;
};
export const canProviderCancel = (bookedMeeting, isProvider) => {
    var _a, _b, _c, _d;
    return dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
        !((_a = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _a === void 0 ? void 0 : _a.providerCanceled) &&
        !((_b = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _b === void 0 ? void 0 : _b.providerDeclined) &&
        !((_c = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _c === void 0 ? void 0 : _c.clientCanceled) &&
        !((_d = bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.status) === null || _d === void 0 ? void 0 : _d.providerDeclined) &&
        isProvider;
};
export const canDecline = (bookedMeeting, isProvider) => dayjs().isBefore(dayjs(bookedMeeting.startTime)) &&
    !bookedMeeting.providerCanceled &&
    !bookedMeeting.clientCanceled &&
    !bookedMeeting.providerDeclined &&
    !bookedMeeting.hasOpenReport &&
    isProvider;
export const canConfirm = (bookedMeeting, isProvider) => dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
    !isProvider &&
    !bookedMeeting.hasOpenReport &&
    !bookedMeeting.clientConfirmed &&
    !bookedMeeting.providerCanceled &&
    !bookedMeeting.providerDeclined &&
    !bookedMeeting.clientCanceled;
export const canComplete = (bookedMeeting, isProvider) => dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
    isProvider &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerConfirmed) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerCanceled) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.clientCanceled) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerDeclined);
export const canRefundReport = (bookedMeeting, isProvider) => dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerConfirmed) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerCanceled) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.clientCanceled) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerDeclined) &&
    (bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.price) > 0 &&
    !isProvider;
export const canReport = (bookedMeeting, isProvider) => dayjs().isAfter(dayjs(bookedMeeting.endTime)) &&
    !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerConfirmed) &&
    !bookedMeeting.providerCanceled &&
    !bookedMeeting.clientCanceled &&
    !bookedMeeting.providerDeclined &&
    !isProvider;
// freelance
export const canClientCancelOrder = (bookedMeeting, isProvider, isOneHourPassedSinceBooking, isDueDatePassed) => !isProvider &&
    (isDueDatePassed || !isOneHourPassedSinceBooking) &&
    !bookedMeeting.clientConfirmed &&
    !bookedMeeting.clientCanceled &&
    !bookedMeeting.refundRequested &&
    !bookedMeeting.hasOpenReport;
export const canRequestRefund = (bookedMeeting, isProvider, dueDateUTC) => !isProvider &&
    dayjs().isAfter(dueDateUTC()) &&
    bookedMeeting.price > 0 &&
    !bookedMeeting.clientConfirmed &&
    !bookedMeeting.clientCanceled &&
    !bookedMeeting.refundRequested &&
    !bookedMeeting.hasOpenReport;
export const canClientConfirmOrder = (bookedMeeting, isProvider) => !isProvider &&
    !bookedMeeting.clientConfirmed &&
    !bookedMeeting.clientCanceled &&
    !bookedMeeting.hasOpenReport &&
    !bookedMeeting.refundRequested;
export const canProviderCompleteOrder = (bookedMeeting, isProvider) => isProvider && !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerConfirmed) && !(bookedMeeting === null || bookedMeeting === void 0 ? void 0 : bookedMeeting.providerCanceled);
//# sourceMappingURL=validators.js.map