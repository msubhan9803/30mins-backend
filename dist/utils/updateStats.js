var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { BUSSINESS_STATS } from '../constants/enums';
import GlobalBussiness from '../MongoModels/GlobalBussiness';
let count = 0;
const updateStats = (input, value) => __awaiter(void 0, void 0, void 0, function* () {
    const field = BUSSINESS_STATS[input];
    // console.log(field);
    if (!field)
        throw new Error('Invalid field Value');
    const helpObj = (yield GlobalBussiness.find()).at(-1);
    // console.log(helpObj);
    const lastDoc = Object.assign({}, helpObj._doc);
    delete lastDoc._v;
    delete lastDoc._id;
    delete lastDoc.updatedAt;
    count++;
    lastDoc[field] += value;
    const result = new GlobalBussiness(Object.assign({}, lastDoc));
    yield result.save();
});
export default updateStats;
//# sourceMappingURL=updateStats.js.map