import mongoose from 'mongoose';
const { Schema } = mongoose;
const statisticsProcessingQueueSchema = new Schema({
    timeStamp: { type: String },
    schemaName: String,
    fields: {},
}, { collection: 'statisticsProcessingQueues' });
export default mongoose.model('StatisticsProcessingQueue', statisticsProcessingQueueSchema);
//# sourceMappingURL=StatisticsProcessingQueue.js.map