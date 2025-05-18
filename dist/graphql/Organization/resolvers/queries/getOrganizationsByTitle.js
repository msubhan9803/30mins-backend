var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Organization from '../../../../MongoModels/Organization';
import escapeStringRegexp from 'escape-string-regexp';
import createApiLog, { ApiLogLevels, ApiLogTypes } from '../../../../utils/createApiLog';
export default function getOrganizationsByTitle(parent, { title }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationsByTitle',
                functionParams: [
                    {
                        paramName: 'title',
                        paramValue: title,
                        paramType: typeof title,
                    },
                ],
            });
            const safeTitleString = escapeStringRegexp(title);
            const regex = new RegExp(safeTitleString, 'i');
            const organizationResults = yield Organization.find({
                title: { $regex: regex },
            })
                .orFail(() => new Error('Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationsByTitle',
                functionParams: [
                    {
                        paramName: 'title',
                        paramValue: title,
                        paramType: typeof title,
                    },
                ],
                additionalMessage: 'Query Successful',
                startLogId,
            });
            return {
                response: {
                    message: 'Query Successful',
                    status: 200,
                },
                organizationData: organizationResults,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationsByTitle',
                functionParams: [
                    {
                        paramName: 'title',
                        paramValue: title,
                        paramType: typeof title,
                    },
                ],
                additionalMessage: err.message,
                startLogId,
            });
            return {
                response: {
                    message: err.message,
                    status: 500,
                },
            };
        }
    });
}
//# sourceMappingURL=getOrganizationsByTitle.js.map