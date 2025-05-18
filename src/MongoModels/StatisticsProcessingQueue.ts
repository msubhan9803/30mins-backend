import mongoose from 'mongoose';
import {SITEMAP_TYPES} from '../constants/enums';

const {Schema} = mongoose;

const statisticsProcessingQueueSchema = new Schema(
  {
    timeStamp: {type: String},
    schemaName: String,
    fields: {},
  },
  {collection: 'statisticsProcessingQueues'}
);

export default mongoose.model('StatisticsProcessingQueue', statisticsProcessingQueueSchema);
