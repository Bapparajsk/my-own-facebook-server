import { Schema, model, Document } from "mongoose";

export interface PostValediction extends Document {
    token: string
    createAt: Date
}

const postVValedictionSchema: Schema<PostValediction> = new Schema({
    token: { type: String, required: true },
    createAt: { type: Date, required: true }
});

export const PostValedictionModel = model<PostValediction>('PostVValediction', postVValedictionSchema);
