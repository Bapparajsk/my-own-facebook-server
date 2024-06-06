// src/types/types.d.ts
import { Request } from 'express';
import {UserSchemaType} from "../interfaces/userSchema.type";

interface UserPayload {
    userId?: string
    userName: string;
    email?: string;
    password?: string;
    otp?: string
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: UserPayload;
        User?: UserSchemaType;
    }
}
