import { Schema, model, Document } from 'mongoose';

// TypeScript interface
export interface ChatSchemaType extends Document {
    hashId: string;
    chat: { name: string; message: string }[];
}

// Mongoose schema
const chatSchema = new Schema<ChatSchemaType>({
    hashId: {
        type: String,
        required: true,
    },
    chat: [
        {
            name: {
                type: String,
                required: true,
            },
            message: {
                type: String,
                required: true,
            },
        },
    ],
}, { timestamps: true });

export const ChatModel = model<ChatSchemaType>('Chat', chatSchema);
