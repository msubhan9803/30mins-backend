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
export default function getOrganizationBySlug(parent, { slug }, context, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let startLogId;
        try {
            startLogId = yield createApiLog({
                type: ApiLogTypes.QUERY_START,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationBySlug',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
                    },
                ],
            });
            const safeSlugString = escapeStringRegexp(slug);
            const pattern = `^${safeSlugString}$`;
            const regex = new RegExp(pattern, 'i');
            const organizationResult = yield Organization.findOne({
                slug: { $regex: regex },
            })
                .populate('services')
                .orFail(() => new Error('Document Not Found'))
                .exec();
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.INFO,
                functionName: 'getOrganizationBySlug',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
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
                organizationData: organizationResult,
            };
        }
        catch (err) {
            yield createApiLog({
                type: ApiLogTypes.QUERY_END,
                level: ApiLogLevels.ERROR,
                functionName: 'getOrganizationBySlug',
                functionParams: [
                    {
                        paramName: 'slug',
                        paramValue: slug,
                        paramType: typeof slug,
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
//# sourceMappingURL=getOrganizationBySlug.js.map