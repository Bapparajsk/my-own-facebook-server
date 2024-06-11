import {NextFunction, Request, Response} from "express";
import jwt from 'jsonwebtoken';
import {addToBlacklist, isBlacklisted} from "../utils/blacklist";
import {UserPayload} from "../@types/types";


export const verifyOtp = (req: Request , res: Response, next: NextFunction) => {
    const { otp } = req.body;
    const token = req.headers['accesstoken'] as string;

    if (token && isBlacklisted(token)) {
        return res.status(401).send({
            success: false,
            message: 'token are blacklisted'
        });
    }

    if (!token || !otp) {
        return res.status(401).send({
            success: false,
            message: 'token or otp not provided'
        });
    }

    const SECRET = process.env.JWT_SECRET!;

    try {
        const decoded = jwt.verify(token, SECRET) as UserPayload;
        if (decoded.otp === otp) {
            req.user = decoded;
            addToBlacklist(token);
            return next();
        } else {
            return res.status(401).json({
                success: false,
                message : 'Invalid OTP'
            });
        }
    } catch (err) {
        return res.status(401).json({
            success: false, message: 'Invalid token'
        });
    }
}

export const verifyUser = (req: Request , res: Response, next: NextFunction) => {
    const token = req.headers['accesstoken'] as string;


    if (token && isBlacklisted(token)) {
        return res.status(401).send({
            success: false,
            message: 'token are blacklisted'
        });
    }

    if (!token) {
        return res.status(401).send({
            success: false,
            message: 'token or otp not provided'
        });
    }

    try {
        const SECRET = process.env.JWT_SECRET!;
        req.user = jwt.verify(token, SECRET) as UserPayload;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
}
