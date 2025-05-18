var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import escapeStringRegexp from 'escape-string-regexp';
import User from '../../../../MongoModels/User';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getUserSearchResults(parent, { userSearchParams }) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            const { keywords, location, isIndividual, pageNumber, resultsPerPage } = userSearchParams;
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getUserSearchResults',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
                    },
                ],
            });
            const baseQuery = { $and: [] };
            let skipCount = pageNumber * resultsPerPage - resultsPerPage;
            let userCount;
            if (keywords) {
                const safeKeywords = escapeStringRegexp(keywords);
                const regex = new RegExp(safeKeywords, 'i');
                const keywordsQuery = { $or: [] };
                keywordsQuery.$or.push({ 'accountDetails.username': { $regex: regex } });
                keywordsQuery.$or.push({ 'personalDetails.headline': { $regex: regex } });
                keywordsQuery.$or.push({ 'personalDetails.name': { $regex: regex } });
                baseQuery.$and.push(keywordsQuery);
            }
            if (isIndividual === true) {
                baseQuery.$and.push({ 'accountDetails.isIndividual': isIndividual });
            }
            else if (isIndividual === false) {
                baseQuery.$and.push({ 'accountDetails.isIndividual': isIndividual });
            }
            if (location) {
                const safeLocation = escapeStringRegexp(location);
                const regex = new RegExp(safeLocation, 'i');
                const locationQuery = { $or: [] };
                locationQuery.$or.push({ 'locationDetails.country': { $regex: regex } });
                locationQuery.$or.push({ 'locationDetails.zipCode': { $regex: regex } });
                baseQuery.$and.push(locationQuery);
            }
            const constructedQuery = Object.assign(Object.assign({}, baseQuery), { services: { $ne: [] }, 'accountDetails.privateAccount': false });
            if (constructedQuery.$and.length === 0) {
                delete constructedQuery.$and;
            }
            if (!keywords && !location) {
                // If no search query is passed, skip random amount of documents
                userCount = yield User.count(constructedQuery).exec();
                skipCount = Math.floor(Math.random() * userCount);
            }
            else {
                userCount = yield User.count(constructedQuery).exec();
            }
            const users = yield User.find(constructedQuery).skip(skipCount).limit(resultsPerPage).exec();
            if (users.length === 0) {
                yield createApiLog({
                    type: ApiLogTypes.QUERY_END,
                    level: ApiLogLevels.INFO,
                    functionName: 'getUserSearchResults',
                    functionParams: [
                        {
                            paramName: 'userSearchParams',
                            paramValue: userSearchParams,
                            paramType: typeof userSearchParams,
                        },
                    ],
                    additionalMessage: 'No Users Found',
                    startLogId,
                });
                return {
                    userData: users,
                    response: {
                        message: 'No Users Found',
                        status: 404,
                    },
                };
            }
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getUserSearchResults',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                userData: users,
                userCount,
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getUserSearchResults',
                functionParams: [
                    {
                        paramName: 'userSearchParams',
                        paramValue: userSearchParams,
                        paramType: typeof userSearchParams,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: { message: err.message, status: 500 },
            };
        }
    });
}
//# sourceMappingURL=searchMutualAuthUser.js.map