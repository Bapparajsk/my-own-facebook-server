import express from "express";
import {createJWT, createJwtFromUser} from "../helper/jsonwebtoken";
import { UserPayload } from '../@types/types';
import userModel from "../model/user.model";
import {sendOtp} from "../helper/sendOTP";
import {verifyOtp, verifyUser} from "../middleware/verifyOtp";
import {addToBlacklist} from "../utils/blacklist";
import bcrypt from "bcrypt";
import passport from "../config/passport.config";
import {UserSchemaType} from '../interfaces/userSchema.type'

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { userName, email, password } = req.body;
        const user = await userModel.findOne({ name: userName });

        if (user) {
            return res.status(400).json({
                success: false,
                message: 'userName already exists',
            });
        }

        const mail =  await sendOtp(userName, email);

        if (mail.error) {
            return res.status(500).json({
                success: false,
                message: 'email are not valid'
            });
        }
        const newToken = createJWT(<UserPayload>{userName, email, password, otp: mail.otp});

        return res.status(200).json({
            success: true,
            token: newToken,
            message: 'created authorization token successfully.',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.post('/send-otp', verifyUser, async (req, res) => {
    try {
        // @ts-ignore
        const { userName, email, password } = req.user;
        const mail =  await sendOtp(userName, email);
        if (mail.error) {
            return res.status(500).json({
                success: false,
                message: 'email are not valid'
            });
        }

        const newToken = createJWT(<UserPayload>{userName, email, password, otp: mail.otp});
        const {token} = req.headers;
        if (token) addToBlacklist(token);

        return res.status(200).json({
            success: true,
            token: newToken,
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

router.post('/verify-otp', verifyOtp, async (req, res) => {
    try {
        const user = req.user as UserPayload;

        const {userName, email, password} = user ;
        const userDetails = {
            name: userName,
            emails: [{value: email}],
            password: password
        }
        const newUser = new userModel(userDetails);
        await newUser.save();
        const token = createJwtFromUser(<UserPayload>{userId: newUser._id, userName, email});

        return res.status(200).json({
            success: true,
            token: token,
            message: 'verify otp verification token',
            user: newUser
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
});

router.post('/login', async (req, res) => {
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

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', (err: any, user: Express.User, info: any) => {
        if (err) {
            // Handle the error and redirect
            return res.redirect('http://localhost:3000/login?invalid=true');
        }
        if (!user) {
            // No user found, handle accordingly
            return res.redirect('http://localhost:3000/login?invalid=true');
        }

        req.logIn(user, (err) => {
            if (err) {
                // Handle login error
                return res.redirect('http://localhost:3000/login?invalid=true');
            }

            const {_id, name} = user as UserSchemaType;
            const token = createJwtFromUser(<UserPayload>{userId: _id, userName: name});
            return res.redirect(`http://localhost:3000/profile?token=${token}`);
        });
    })(req, res, next);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', (req, res, next) => {
    passport.authenticate('github', (err: any, user: Express.User, info: any) => {
        if (err) {
            // Handle the error and redirect
            return res.redirect('http://localhost:3000/login?invalid=true');
        }
        if (!user) {
            // No user found, handle accordingly
            return res.redirect('http://localhost:3000/login?invalid=true');
        }

        req.logIn(user, (err) => {
            if (err) {
                // Handle login error
                return res.redirect('http://localhost:3000/login?invalid=true');
            }

            const {_id, name} = user as UserSchemaType;
            const token = createJwtFromUser(<UserPayload>{userId: _id, userName: name});
            return res.redirect(`http://localhost:3000/profile?token=${token}`);
        });
    })(req, res, next);
});
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', (err: any, user: Express.User, info: any) => {
        if (err) {
            // Handle the error and redirect
            return res.redirect('http://localhost:3000/login?invalid=true');
        }
        if (!user) {
            // No user found, handle accordingly
            return res.redirect('http://localhost:3000/login?invalid=true');
        }

        req.logIn(user, (err) => {
            if (err) {
                // Handle login error
                return res.redirect('http://localhost:3000/login?invalid=true');
            }

            const {_id, name} = user as UserSchemaType;
            const token = createJwtFromUser(<UserPayload>{userId: _id, userName: name});
            return res.redirect(`http://localhost:3000/profile?token=${token}`);
        });
    })(req, res, next);
});

export default router;
