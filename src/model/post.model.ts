import {model, Schema} from "mongoose";
import { PostSchemaType, CommentType } from '../interfaces/postSchema.type'

const CommentSchema: Schema<CommentType> = new Schema({
    id: { type: String, required: true},
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userImage: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    modify: { type: Date, default: Date.now },
    comment: { type: String, required: true },
});

// Define the Post Schema
const PostSchema: Schema<PostSchemaType> = new Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    imageUrl: { type: String || undefined },
    createdAt: { type: Date, default: Date.now },
    modify: { type: Date, default: Date.now },
    description: { type: String, required: true },
    contentUrl: { type: String, required: true },
    contentType: { type: String, required: true },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    comments: {type: Map, of: CommentSchema , default: {}}
});

// Create and export the Post model
const Post = model<PostSchemaType>('Post', PostSchema);
export default Post;
