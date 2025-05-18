import mongoose from 'mongoose';

const {Schema} = mongoose;

const postSchema = new Schema(
  {
    userId: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    title: {
      type: String,
      maxLength: 256,
      required: true,
    },
    image: String,
    description: {
      type: String,
      required: true,
    },
    tags: [String],
  },
  {collection: 'posts', timestamps: true}
);

export default mongoose.model('Post', postSchema);
