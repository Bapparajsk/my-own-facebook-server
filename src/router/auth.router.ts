import express, {Request, Response} from "express";
import {createJWT, createJwtFromUser} from "../helper/jsonwebtoken";
import { UserPayload } from '../@types/types';
import userModel from "../model/user.model";
import {sendOtp} from "../helper/sendOTP";
import {verifyOtp, verifyUser} from "../middleware/verifyOtp";
import {addToBlacklist} from "../utils/blacklist";
import bcrypt from "bcrypt";
import passport, {authenticateAndRedirect} from "../config/passport.config";

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { userName, email, password } = req.body;

        const [findByName, findByEmail] = await Promise.all([
            await userModel.findOne({ name: userName }),
            await userModel.findOne({ 'emails.value': email })
        ])

        if (findByName || findByEmail) {
            return res.status(400).json({
                success: false,
                message: `${ findByName ? 'userName' : 'email' } already exists`,
            });
        }

        const mail =  await sendOtp(userName, email);

        if (mail.error) {
            return res.status(500).json({
                success: false,
                message: 'email are not valid'
            });
        }
        const accessToken = createJWT(<UserPayload>{userName, email, password, otp: mail.otp});

        return res.status(200).json({
            success: true,
            accessToken,
            message: 'created authorization token successfully.',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.post('/send-otp', verifyUser, async (req: Request, res: Response) => {
    try {
        const { userName, email, password } = req.user as UserPayload;
        const mail =  await sendOtp(userName, email!);
        if (mail.error) {
            return res.status(500).json({
                success: false,
                message: 'email are not valid'
            });
        }

        const accessToken = createJWT(<UserPayload>{userName, email, password, otp: mail.otp});
        const {token} = req.headers;
        if (token) addToBlacklist(token);

        return res.status(200).json({
            success: true,
            accessToken,
            message: 'otp send successfully.',
        });

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.post('/verify-otp', verifyOtp, async (req: Request, res: Response) => {
    try {
        const user = req.user as UserPayload;

        const {userName, email, password} = user ;
        const userDetails = {
            name: userName,
            emails: [{value: email}],
            password: password,
            chat: {head: null, linkedList: {}},
        }
        const newUser = new userModel(userDetails);
        await newUser.save();
        const token = createJwtFromUser(<UserPayload>{userId: newUser._id, userName, email});

        const getUser = await userModel.findById(newUser._id).select(
            'name active dateOfBirth emails profileImage socialLink post reel friends friendRequest friendRequestSend chat notification createdAt, role')

        return res.status(200).json({
            success: true,
            token: token,
            message: 'otp verified successfully.',
            user: getUser
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(401).json({
                success: false,
                message: 'email or password are require',
            });
        }

        const User = await userModel.findOne({ 'emails.value': email });

        if (!User) {
            return res.status(401).json({
                success: false,
                message: 'invalid email or password',
            })
        }

        const mach = await bcrypt.compare(password, User.password);
        if (!mach) {
            return res.status(401).json({
                success: false,
                message: 'invalid email or password',
            })
        }

        const token = createJwtFromUser(<UserPayload>{userId: User._id, userName: User.name, email});

        return res.status(200).json({
            success: true,
            token: token,
            user: User,
            message: 'login successfully.',
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authenticateAndRedirect('google'));

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', authenticateAndRedirect('github'));

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', authenticateAndRedirect('facebook',));

export default router;
