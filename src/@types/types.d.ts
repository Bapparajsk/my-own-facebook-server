// src/types/types.d.ts
import { Request } from 'express';

interface UserPayload {
    userName: string;
    email: string;
    password: string;
    otp: string
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: UserPayload;
    }
}
