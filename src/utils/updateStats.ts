import {BUSSINESS_STATS} from '../constants/enums';
import GlobalBussiness from '../MongoModels/GlobalBussiness';

let count = 0;

const updateStats = async (input, value) => {
  const field = BUSSINESS_STATS[input];
  // console.log(field);
  if (!field) throw new Error('Invalid field Value');

  const helpObj = (await GlobalBussiness.find()).at(-1);
  // console.log(helpObj);
  const lastDoc = {...helpObj._doc};

  delete lastDoc._v;
  delete lastDoc._id;
  delete lastDoc.updatedAt;
  count++;
  lastDoc[field] += value;

  const result = new GlobalBussiness({...lastDoc});
  await result.save();
};

export default updateStats;
