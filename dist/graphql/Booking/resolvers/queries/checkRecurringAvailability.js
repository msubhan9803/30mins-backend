var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import User from '../../../../MongoModels/User';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
dayjs.extend(utc);
dayjs.extend(timezone);
export default function checkRecurringAvailability(parent, { providerUsername, initialBookingDateTime, meetingCount }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId = '';
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'checkRecurringAvailability',
                functionParams: [
                    {
                        paramName: 'providerUsername',
                        paramValue: providerUsername,
                        paramType: typeof providerUsername,
                    },
                    {
                        paramName: 'initialBookingDateTime',
                        paramValue: initialBookingDateTime,
                        paramType: typeof initialBookingDateTime,
                    },
                    {
                        paramName: 'meetingCount',
                        paramValue: meetingCount,
                        paramType: typeof meetingCount,
                    },
                ],
            });
            const providerData = yield User.findOne({ 'accountDetails.username': providerUsername }, ['_id']);
            if (!providerData) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'checkRecurringAvailability',
                    functionParams: [
                        {
                            paramName: 'providerUsername',
                            paramValue: providerUsername,
                            paramType: typeof providerUsername,
                        },
                        {
                            paramName: 'initialBookingDateTime',
                            paramValue: initialBookingDateTime,
                            paramType: typeof initialBookingDateTime,
                        },
                        {
                            paramName: 'meetingCount',
                            paramValue: meetingCount,
                            paramType: typeof meetingCount,
                        },
                    ],
                    additionalMessage: 'Service Not Found',
                    startLogId,
                });
            }
            const meetingArr = [];
            for (let index = 0; index <= meetingCount; index++) {
                meetingArr.push(dayjs(initialBookingDateTime)
                    .add(index * 7, 'day')
                    .toISOString());
            }
            const providerUser = [{ _id: providerData._id }];
            const busyTimes = yield getBusyTimes(providerUser, meetingArr[0], meetingArr[meetingCount]);
            try {
                meetingArr.forEach(meetingTime => {
                    let isBusy = false;
                    busyTimes.forEach(slot => {
                        if (dayjs(slot.start).isSameOrBefore(dayjs(meetingTime.replace('.000Z', 'Z'))) &&
                            dayjs(slot.start).isSameOrAfter(dayjs(meetingTime.replace('.000Z', 'Z')))) {
                            isBusy = true;
                        }
                    });
                    if (isBusy) {
                        throw new Error('Provider is not Available for Recurring');
                    }
                });
                return {
                    isAvailable: true,
                    availabilities: meetingArr,
                    response: {
                        message: 'Provider is available!',
                        status: 200,
                    },
                };
            }
            catch (err) {
                return {
                    isAvailable: false,
                    availabilities: [],
                    response: {
                        message: err.message,
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'checkRecurringAvailability',
                functionParams: [
                    {
                        paramName: 'providerUsername',
                        paramValue: providerUsername,
                        paramType: typeof providerUsername,
                    },
                    {
                        paramName: 'initialBookingDateTime',
                        paramValue: initialBookingDateTime,
                        paramType: typeof initialBookingDateTime,
                    },
                    {
                        paramName: 'meetingCount',
                        paramValue: meetingCount,
                        paramType: typeof meetingCount,
                    },
                ],
                additionalMessage: 'Availability Slots Returned',
                startLogId,
            });
            return {
                isAvailable: true,
                availabilities: [],
                response: {
                    message: 'Provider is available!',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'checkRecurringAvailability',
                functionParams: [
                    {
                        paramName: 'providerUsername',
                        paramValue: providerUsername,
                        paramType: typeof providerUsername,
                    },
                    {
                        paramName: 'initialBookingDateTime',
                        paramValue: initialBookingDateTime,
                        paramType: typeof initialBookingDateTime,
                    },
                    {
                        paramName: 'meetingCount',
                        paramValue: meetingCount,
                        paramType: typeof meetingCount,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                message: err.message,
                status: 500,
            };
        }
    });
}
//# sourceMappingURL=checkRecurringAvailability.js.map