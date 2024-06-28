import { Schema, model, Document } from "mongoose";

export interface PostValediction extends Document {
    key: string
    token: string
    createAt: Date
}

const postVValedictionSchema: Schema<PostValediction> = new Schema({
    key: { type: String, required: true },
    token: { type: String, required: true, unique: true},
    createAt: { type: Date, required: true }
});

export const PostValedictionModel = model<PostValediction>('PostVValediction', postVValedictionSchema);
