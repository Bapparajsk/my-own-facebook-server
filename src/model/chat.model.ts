import { Schema, model, Document } from 'mongoose';

// TypeScript interface
export interface ChatSchemaType extends Document {
    usersId: string;
    chat: { name: string; message: string }[];
}

// Mongoose schema
const chatSchema = new Schema<ChatSchemaType>({
    usersId: {
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

const Chat = model<ChatSchemaType>('Chat', chatSchema);

export default Chat;
