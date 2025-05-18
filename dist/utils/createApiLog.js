var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import ApiLog from '../MongoModels/ApiLog';
export var ApiLogTypes;
(function (ApiLogTypes) {
    ApiLogTypes["QUERY_START"] = "QUERY_START";
    ApiLogTypes["QUERY_END"] = "QUERY_END";
    ApiLogTypes["MUTATION_START"] = "MUTATION_START";
    ApiLogTypes["MUTATION_END"] = "MUTATION_END";
    ApiLogTypes["CRON_JOB_START"] = "CRON_JOB_START";
    ApiLogTypes["CRON_JOB_END"] = "CRON_JOB_END";
    ApiLogTypes["API_PROCESSING_START"] = "API_PROCESSING_START";
    ApiLogTypes["API_PROCESSING_END"] = "API_PROCESSING_END";
})(ApiLogTypes || (ApiLogTypes = {}));
export var ApiLogLevels;
(function (ApiLogLevels) {
    ApiLogLevels["INFO"] = "INFO";
    ApiLogLevels["ERROR"] = "ERROR";
})(ApiLogLevels || (ApiLogLevels = {}));
export default function createApiLog(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { type, level, functionName, functionParams, additionalMessage, startLogId } = config;
            const convertedStartLogId = startLogId || '';
            if (LOG_FILTER_TYPES.includes(type) && LOG_FILTER_LEVELS.includes(level)) {
                const convertedParams = functionParams.map(param => {
                    const convertedParamValue = JSON.stringify(param.paramValue);
                    param.paramValue = convertedParamValue;
                    return param;
                });
                const createdLog = yield ApiLog.create({
                    type,
                    level,
                    functionName,
                    functionParams: convertedParams,
                    additionalMessage,
                    startLogId: convertedStartLogId,
                });
                return createdLog._id.valueOf();
            }
            return '';
        }
        catch (err) {
            console.log('Error Occurred Creating Api Log', err.message);
            const convertedStartLogId = config.startLogId || '';
            yield ApiLog.create({
                type: 'API_LOG_CREATION',
                level: 'ERROR',
                functionName: 'createApiLog',
                functionParams: [
                    { paramName: 'config', paramValue: JSON.stringify(config), paramType: typeof config },
                ],
                additionalMessage: `Unknown Error: ${err.message}`,
                startLogId: convertedStartLogId,
            });
            return '';
        }
    });
}
//# sourceMappingURL=createApiLog.js.map