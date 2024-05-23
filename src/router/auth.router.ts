import express from "express";
import {createJWT, createJwtFromUser, User} from "../helper/jsonwebtoken";
import userModel from "../model/user.model";
import {sendOtp} from "../helper/sendOTP";
import {verifyOtp, verifyUser} from "../middleware/verifyOtp";
import {addToBlacklist} from "../utils/blacklist";
import bcrypt from "bcrypt";
import passport from "../config/passport.config";

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
        const newToken = createJWT(<User>{userName, email, password, otp: mail.otp});

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

        const newToken = createJWT(<User>{userName, email, password, otp: mail.otp});
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
        const user = req.user;
        // @ts-ignore
        const {userName, email, password} = user;
        // console.log(name, email, password);
        const newUser = new userModel({ name: userName, email, password });
        const token = createJwtFromUser(<User>{userId: newUser._id, userName, email});

        await newUser.save();

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

        const User = await userModel.findOne({ email: {$in: [email]} });

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

        const token = createJwtFromUser(<User>{userId: User._id, userName: User.name, email});

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

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('http://localhost:3000/');
    }
);

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login'}), (req, res) => {
    console.log("req.user", req.user);
    res.json({
        success: true,
        token: req.headers.authorization,
    });
});

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login',
    successRedirect: 'http://localhost:3000/',
}));

export default router;
