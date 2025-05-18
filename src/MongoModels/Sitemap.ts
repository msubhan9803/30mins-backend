import mongoose from 'mongoose';
import { SITEMAP_TYPES } from '../constants/enums';

const {Schema} = mongoose;

const sitemapSchema = new Schema(
  {
    sitemapType: {
      type: String,
      enum: [SITEMAP_TYPES.PROFILES, SITEMAP_TYPES.SERVICES, SITEMAP_TYPES.ORGANIZATIONS],
      required: true,
    },
    index: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    isChanged: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {collection: 'sitemaps'} 
);

export default mongoose.model('Sitemap', sitemapSchema);
