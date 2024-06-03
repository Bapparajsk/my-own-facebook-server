import {NextFunction, Request, Response} from "express";
import jwt from "jsonwebtoken";
import {UserPayload} from "../@types/types";
import UserModel from "../model/user.model";
import {UserSchemaType} from "../interfaces/schema.type";

const SECRET = process.env.JWT_SECRET!;

const authenticateToken = async (token: string) => {
    const user = jwt.verify(token, SECRET) as UserPayload;
    if (!user.userId) throw new Error('user not found');
    const foundUser = await UserModel.findById(user.userId) as UserSchemaType;
    if (!foundUser) throw new Error('user not found');
    return foundUser;
}
const verifyOtp = (user: UserSchemaType, name: 'email' | 'phoneNumber', otp: string) => ( user.otp[name]?.otp === otp );

const Authentication = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['token'] as string;

    if (!token) {
        return res.status(401).send({
            success: false,
            message: 'Token is missing'
        });
    }

    try {
        req.User = await authenticateToken(token);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

const verifyOtpFromEmail = async (req: Request, res: Response, next: NextFunction) => {
    const otp = req.body['otp'] as string;
    const token = req.headers['token'] as string;

    if (!token || !otp) {
        return res.status(401).send({
            success: false,
            message: 'token or otp is missing'
        })
    }

    try {
        const user = await authenticateToken(token);
        if (!verifyOtp(user, 'email', otp)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        req.User = user;
        next();
    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error'
        })
    }
}

export default { Authentication, verifyOtpFromEmail }
