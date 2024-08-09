import { Schema, model, Document } from 'mongoose';

// TypeScript interface
export interface ChatSchemaType extends Document {
    hashId: string;
    chat: { 
        sender: string; 
        message: string; 
        time: Date;
    }[];
    read: {
        [key: string]: number | undefined;
    };
}

// Mongoose schema
const chatSchema = new Schema<ChatSchemaType>({
    hashId: {
        type: String,
        required: true,
    },
    chat: [{
        sender: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        time: {
            type: Date,
            default: Date.now,
        },
    }],
    read: {
        type: Map,
        of: {
            type: Schema.Types.Mixed,
            default: undefined
        },
        default: {},
    },
}, { timestamps: true });

export const ChatModel = model<ChatSchemaType>('Chat', chatSchema);
