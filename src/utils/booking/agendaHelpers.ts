export const cancelAgendaWithBookingId = async (bookingId, agendaInstance, agendaJobs) =>
  agendaInstance.cancel({
    'data.bookingId': bookingId,
    name: {$in: agendaJobs},
  });
