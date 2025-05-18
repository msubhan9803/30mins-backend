import GlobalBussiness from '../MongoModels/GlobalBussiness';
import StatisticsProcessingQueue from '../MongoModels/StatisticsProcessingQueue';

const emptyStatsQueue = async () => {
  const queue = await StatisticsProcessingQueue.find({}).sort({timeStamp: 1}).limit(20);
  if (queue.length === 0) {
    return;
  }
  for await (const entity of queue) {
    const helpObj = await (await GlobalBussiness.find().sort({$natural: -1}).limit(1)).at(0);
    const lastDoc = {...helpObj._doc};
    delete lastDoc.__v;
    delete lastDoc._id;
    delete lastDoc.updatedAt;
    //   TODO: add loop to update field dynamically
    Object.entries(entity.fields).forEach(([key, value]) => {
      lastDoc[key] += value;
    });
    const result = new GlobalBussiness({...lastDoc, timeStamp: entity.timeStamp});
    await result.save();
  }

  const queueIds = queue.map(doc => doc._doc._id);

  await StatisticsProcessingQueue.deleteMany({
    _id: {$in: queueIds},
  });
  return null;
};

export default emptyStatsQueue;
