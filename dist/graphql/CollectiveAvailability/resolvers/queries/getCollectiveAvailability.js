var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
import AwsSecrets from '../../../../utils/getAwsSecrets';
import User from '../../../../MongoModels/User';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import minMax from 'dayjs/plugin/minMax';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import getBusyTimes from '../../../../utils/busyTimes/getBusyTimes';
import ActiveExtension from '../../../../MongoModels/ActiveExtension';
import stripeProductIDs from '../../../../constants/stripeProductIDs';
import _ from 'lodash';
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(isBetween);
dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);
export default function getCollectiveAvailability(parent, { emails, date, duration, checkExtension }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        const SECRETS = yield AwsSecrets.getInstance();
        const accessTokenSecret = SECRETS.JWT_ACCESS_TOKEN_SECRET;
        let startLogId;
        const { token } = context;
        try {
            const decodedToken = jwt.verify(token, accessTokenSecret);
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getCollectiveAvailability',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'emails',
                        paramValue: emails,
                        paramType: typeof emails,
                    },
                    {
                        paramName: 'date',
                        paramValue: date,
                        paramType: typeof date,
                    },
                    {
                        paramName: 'duration',
                        paramValue: duration,
                        paramType: typeof duration,
                    },
                    {
                        paramName: 'checkExtension',
                        paramValue: checkExtension,
                        paramType: typeof checkExtension,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                ],
            });
            if (checkExtension) {
                const hasExtension = yield ActiveExtension.exists({
                    userId: decodedToken.UserId,
                    extensionProductId: stripeProductIDs.EXTENSIONS.COLLECTIVE_AVAILABILITY,
                    status: {
                        $in: ['paid', 'gifted'],
                    },
                });
                if (!hasExtension) {
                    yield createApiLog({
                        type: ApiLogTypes.QUERY_END,
                        level: ApiLogLevels.ERROR,
                        functionName: 'getCollectiveAvailability',
                        functionParams: [
                            {
                                paramName: 'token',
                                paramValue: 'HIDDEN_TOKEN',
                                paramType: typeof token,
                            },
                            {
                                paramName: 'emails',
                                paramValue: emails,
                                paramType: typeof emails,
                            },
                            {
                                paramName: 'date',
                                paramValue: date,
                                paramType: typeof date,
                            },
                            {
                                paramName: 'duration',
                                paramValue: duration,
                                paramType: typeof duration,
                            },
                            {
                                paramName: 'checkExtension',
                                paramValue: checkExtension,
                                paramType: typeof checkExtension,
                            },
                            {
                                paramName: 'userId',
                                paramValue: decodedToken.UserId,
                                paramType: typeof decodedToken.UserId,
                            },
                        ],
                        additionalMessage: 'User does not have COLLECTIVE AVAILABILITY Extension',
                        startLogId,
                    });
                    return {
                        availableTimeSlots: [],
                        response: {
                            message: 'User does not have COLLECTIVE AVAILABILITY Extension',
                            status: 400,
                        },
                    };
                }
            }
            if (duration <= 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCollectiveAvailability',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'emails',
                            paramValue: emails,
                            paramType: typeof emails,
                        },
                        {
                            paramName: 'date',
                            paramValue: date,
                            paramType: typeof date,
                        },
                        {
                            paramName: 'duration',
                            paramValue: duration,
                            paramType: typeof duration,
                        },
                        {
                            paramName: 'checkExtension',
                            paramValue: checkExtension,
                            paramType: typeof checkExtension,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Invalid Duration',
                    startLogId,
                });
                return {
                    availableTimeSlots: [],
                    response: {
                        message: 'Invalid Duration: Duration must be greator than 0.',
                        status: 400,
                    },
                };
            }
            if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCollectiveAvailability',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'emails',
                            paramValue: emails,
                            paramType: typeof emails,
                        },
                        {
                            paramName: 'date',
                            paramValue: date,
                            paramType: typeof date,
                        },
                        {
                            paramName: 'duration',
                            paramValue: duration,
                            paramType: typeof duration,
                        },
                        {
                            paramName: 'checkExtension',
                            paramValue: checkExtension,
                            paramType: typeof checkExtension,
                        },
                        {
                            paramName: 'userId',
                            paramValue: decodedToken.UserId,
                            paramType: typeof decodedToken.UserId,
                        },
                    ],
                    additionalMessage: 'Invalid Date Input',
                    startLogId,
                });
                return {
                    availableTimeSlots: [],
                    response: {
                        message: 'Invalid Date Input.',
                        status: 400,
                    },
                };
            }
            let users = emails.map((email) => __awaiter(this, void 0, void 0, function* () {
                return User.findOne({ 'accountDetails.email': { $regex: email } }, [
                    '_id',
                    'accountDetails.email',
                    'locationDetails.timezone',
                    'workingHours',
                ])
                    .orFail(() => new Error('User Document Not Found'))
                    .exec();
            }));
            users = yield Promise.all(users);
            const startTimeArr = [];
            const endTimeArr = [];
            const day = extractDayName(date);
            users.forEach(user => {
                var _a, _b, _c, _d;
                if ((user === null || user === void 0 ? void 0 : user.workingHours.isCustomEnabled) &&
                    ((_a = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _a === void 0 ? void 0 : _a.isActive) &&
                    ((_b = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _b === void 0 ? void 0 : _b.availability[0])) {
                    const firstSlot = (_c = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _c === void 0 ? void 0 : _c.availability[0];
                    const lastSlot = _.last((_d = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _d === void 0 ? void 0 : _d.availability);
                    startTimeArr.push(dayjs
                        .tz(date, user === null || user === void 0 ? void 0 : user.locationDetails.timezone)
                        .startOf('d')
                        .add(firstSlot.start, 'm')
                        .utc());
                    endTimeArr.push(dayjs.tz(date, user === null || user === void 0 ? void 0 : user.locationDetails.timezone).startOf('d').add(lastSlot.end, 'm').utc());
                }
                else {
                    startTimeArr.push(dayjs
                        .tz(date, user === null || user === void 0 ? void 0 : user.locationDetails.timezone)
                        .startOf('d')
                        .add(user === null || user === void 0 ? void 0 : user.workingHours.startTime.toString(), 'm')
                        .utc());
                    endTimeArr.push(dayjs
                        .tz(date, user === null || user === void 0 ? void 0 : user.locationDetails.timezone)
                        .startOf('d')
                        .add(user === null || user === void 0 ? void 0 : user.workingHours.endTime, 'm')
                        .utc());
                }
            });
            let minTime = dayjs.max(startTimeArr);
            let maxTime = dayjs.min(endTimeArr);
            if (minTime.isSameOrAfter(maxTime)) {
                return {
                    availableTimeSlots: [],
                    response: {
                        message: 'No Slot Available.',
                        status: 200,
                    },
                };
            }
            const busyTimes = yield getBusyTimes(users, minTime.utc().toISOString(), maxTime.utc().toISOString());
            const availableTimeSlots = [];
            while (!minTime.isSameOrAfter(maxTime)) {
                if (!checkIfConflict(busyTimes, minTime, duration) &&
                    includesInUsersWorkingHour(users, minTime, day)) {
                    availableTimeSlots.push(minTime.format('hh:mma'));
                }
                minTime = minTime.add(duration, 'minute');
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getCollectiveAvailability',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'emails',
                        paramValue: emails,
                        paramType: typeof emails,
                    },
                    {
                        paramName: 'date',
                        paramValue: date,
                        paramType: typeof date,
                    },
                    {
                        paramName: 'checkExtension',
                        paramValue: checkExtension,
                        paramType: typeof checkExtension,
                    },
                    {
                        paramName: 'duration',
                        paramValue: duration,
                        paramType: typeof duration,
                    },
                    {
                        paramName: 'minTimePost',
                        paramValue: minTime.utc().format().split('').splice(0, 19).join(''),
                        paramType: typeof minTime.utc().format().split('').splice(0, 19).join(''),
                    },
                    {
                        paramName: 'maxTimePost',
                        paramValue: maxTime.utc().format().split('').splice(0, 19).join(''),
                        paramType: typeof maxTime.utc().format().split('').splice(0, 19).join(''),
                    },
                    {
                        paramName: 'minTimePre',
                        paramValue: minTime.format().split('').splice(0, 19).join(''),
                        paramType: typeof minTime.format().split('').splice(0, 19).join(''),
                    },
                    {
                        paramName: 'maxTimePre',
                        paramValue: maxTime.format().split('').splice(0, 19).join(''),
                        paramType: typeof maxTime.format().split('').splice(0, 19).join(''),
                    },
                ],
                additionalMessage: 'getCollectiveAvailability Query Sucessful',
                startLogId,
            });
            return {
                availableTimeSlots,
                response: {
                    message: 'All Available Slots',
                    status: 200,
                },
            };
        }
        catch (err) {
            if (err.name === 'JsonWebTokenError') {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.ERROR,
                    functionName: 'getCollectiveAvailability',
                    functionParams: [
                        {
                            paramName: 'token',
                            paramValue: 'HIDDEN_TOKEN',
                            paramType: typeof token,
                        },
                        {
                            paramName: 'emails',
                            paramValue: emails,
                            paramType: typeof emails,
                        },
                        {
                            paramName: 'date',
                            paramValue: date,
                            paramType: typeof date,
                        },
                        {
                            paramName: 'duration',
                            paramValue: duration,
                            paramType: typeof duration,
                        },
                        {
                            paramName: 'checkExtension',
                            paramValue: checkExtension,
                            paramType: typeof checkExtension,
                        },
                    ],
                    additionalMessage: 'Invalid Permissions: Invalid JWT Token',
                    startLogId,
                });
                return {
                    availableTimeSlots: [],
                    response: {
                        message: 'Not Authenticated',
                        status: 401,
                    },
                };
            }
            const decodedToken = jwt.verify(token, accessTokenSecret);
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getCollectiveAvailability',
                functionParams: [
                    {
                        paramName: 'token',
                        paramValue: 'HIDDEN_TOKEN',
                        paramType: typeof token,
                    },
                    {
                        paramName: 'emails',
                        paramValue: emails,
                        paramType: typeof emails,
                    },
                    {
                        paramName: 'date',
                        paramValue: date,
                        paramType: typeof date,
                    },
                    {
                        paramName: 'duration',
                        paramValue: duration,
                        paramType: typeof duration,
                    },
                    {
                        paramName: 'userId',
                        paramValue: decodedToken.UserId,
                        paramType: typeof decodedToken.UserId,
                    },
                    {
                        paramName: 'checkExtension',
                        paramValue: checkExtension,
                        paramType: typeof checkExtension,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                availableTimeSlots: [],
                response: { message: err.message, status: 500 },
            };
        }
    });
}
function checkIfConflict(data, minTime, duration) {
    let check = false;
    data.forEach(period => {
        if (minTime.isBetween(dayjs(period.start), dayjs(period.end), null, '[)')) {
            check = true;
        }
    });
    return check;
}
function includesInUsersWorkingHour(users, minTime, day) {
    let userCheck = true;
    let workingHoursCheck = true;
    users.forEach(user => {
        var _a, _b;
        if ((user === null || user === void 0 ? void 0 : user.workingHours.isCustomEnabled) && ((_a = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _a === void 0 ? void 0 : _a.isActive)) {
            workingHoursCheck = (_b = user === null || user === void 0 ? void 0 : user.workingHours[day]) === null || _b === void 0 ? void 0 : _b.availability.some(time => {
                return minTime.isBetween(dayjs(day).tz(user === null || user === void 0 ? void 0 : user.locationDetails.timezone).startOf('d').add(time.start, 'm').utc(), dayjs(day).tz(user === null || user === void 0 ? void 0 : user.locationDetails.timezone).startOf('d').add(time.end, 'm').utc(), 'minute', '[]');
            });
            if (!workingHoursCheck) {
                return workingHoursCheck;
            }
        }
        else {
            if (!minTime.isBetween(dayjs(day)
                .tz(user === null || user === void 0 ? void 0 : user.locationDetails.timezone)
                .startOf('d')
                .add(user === null || user === void 0 ? void 0 : user.workingHours.startTime.toString(), 'm')
                .utc(), dayjs(day)
                .tz(user === null || user === void 0 ? void 0 : user.locationDetails.timezone)
                .startOf('d')
                .add(user === null || user === void 0 ? void 0 : user.workingHours.endTime, 'm')
                .utc(), 'minute', '[]')) {
                userCheck = false;
                return userCheck;
            }
        }
    });
    return workingHoursCheck && userCheck;
}
function extractDayName(date) {
    switch (dayjs(date).get('day')) {
        case 0:
            return 'sunday';
            break;
        case 1:
            return 'monday';
            break;
        case 2:
            return 'tuesday';
            break;
        case 3:
            return 'wednesday';
            break;
        case 4:
            return 'thursday';
            break;
        case 5:
            return 'friday';
            break;
        case 6:
            return 'saturday';
            break;
        default:
            break;
    }
}
//# sourceMappingURL=getCollectiveAvailability.js.map