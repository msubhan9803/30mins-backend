var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import GlobalBussiness from '../MongoModels/GlobalBussiness';
import StatisticsProcessingQueue from '../MongoModels/StatisticsProcessingQueue';
const emptyStatsQueue = () => __awaiter(void 0, void 0, void 0, function* () {
    var e_1, _a;
    const queue = yield StatisticsProcessingQueue.find({}).sort({ timeStamp: 1 }).limit(20);
    if (queue.length === 0) {
        return;
    }
    try {
        for (var queue_1 = __asyncValues(queue), queue_1_1; queue_1_1 = yield queue_1.next(), !queue_1_1.done;) {
            const entity = queue_1_1.value;
            const helpObj = yield (yield GlobalBussiness.find().sort({ $natural: -1 }).limit(1)).at(0);
            const lastDoc = Object.assign({}, helpObj._doc);
            delete lastDoc.__v;
            delete lastDoc._id;
            delete lastDoc.updatedAt;
            //   TODO: add loop to update field dynamically
            Object.entries(entity.fields).forEach(([key, value]) => {
                lastDoc[key] += value;
            });
            const result = new GlobalBussiness(Object.assign(Object.assign({}, lastDoc), { timeStamp: entity.timeStamp }));
            yield result.save();
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (queue_1_1 && !queue_1_1.done && (_a = queue_1.return)) yield _a.call(queue_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    const queueIds = queue.map(doc => doc._doc._id);
    yield StatisticsProcessingQueue.deleteMany({
        _id: { $in: queueIds },
    });
    return null;
});
export default emptyStatsQueue;
//# sourceMappingURL=emptyStatsQueue.js.map