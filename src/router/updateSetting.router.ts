import express from "express";
import Auth from "../middleware/auth";
import {DateOfBirthType, UserSchemaType} from "../interfaces/userSchema.type";
import {sendOtp} from "../helper/sendOTP";
import bcrypt from "bcrypt";

const router = express.Router();

router.post('/email-otp', Auth.Authentication, async (req, res) => {
    try {
        const email = req.body.email as string;
        const user = req.User as UserSchemaType;

        let isFind =  user.emails.find((e) => e.value === email);
        if (isFind) {
            return res.status(400).json({
                success: false,
                message: 'email already exists'
            })
        }

        const mail =  await sendOtp(user.name, email);
        if (mail.error || !mail.otp) {
            return res.status(500).json({
                success: false,
                message: 'email are not valid'
            });
        }

        user.otp.email = {otp: mail.otp, value: email};
        await user.save();

        // Schedule OTP removal after 5 minutes
        setTimeout(async () => {
            user.otp.email = null;
            await user.save();
        }, 5 * 60 * 1000); // 5 minutes in milliseconds

        return res.status(200).json({
            success: true,
            message: 'otp send successfully',
        });
    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.post('/verify-otp', Auth.verifyOtpFromEmail, async (req, res) => {
    try {
        const user = req.User as UserSchemaType;
        const email = user.otp.email?.value!;
        user.otp.email = null;
        if (!user.emails) user.emails = new Array<{value: string}>();
        user.emails.push({value: email});
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'new email add successfully',
        });

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.post('/change-password', Auth.Authentication, async (req, res) => {
    try {
        const {password, newPassword} = req.body as {password: string, newPassword: string};

        if (newPassword.length < 8 || !password) {
            return res.status(401).json({
                success: false,
                message: 'password must be at least 8 characters'
            });
        }

        const isSamePassword = await bcrypt.compare(password, newPassword);
        if (isSamePassword) {
            return res.status(401).json({
                success: false,
                message: 'you use prev password please try difference password',
            });
        }

        const user = req.User as UserSchemaType;
        const isMach = await bcrypt.compare(password, user.password);

        if (!isMach) {
            return res.status(401).json({
                success: false,
                message: 'invalid password',
            });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'change password successfully',
        });

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.post('/notification-token', Auth.Authentication, async (req, res) => {
    try {
        const notificationToken = req.body.notificationToken as string;
        const user = req.User as UserSchemaType;
        user.notificationToken = notificationToken;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'notification token add successful',
        })
    }catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.post('/change-username', Auth.Authentication, async (req, res) => {
    try {
        const newUsername = req.body.username as string;
        const user = req.User as UserSchemaType;

        if (!newUsername || newUsername.length < 5) {
            return res.status(401).json({
                success: false,
                message: 'invalid username',
            });
        }

        const currentTime = new Date();
        const lastUpdateTime = new Date(user.nameUpdateTime!);
        const daysPassed = Math.floor((currentTime.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60 * 24));

        if (daysPassed < 60) {
            return res.status(400).json({
                success: false,
                message: 'Username can only be changed after 60 days'
            });
        }

        user.name = newUsername;
        user.nameUpdateTime = currentTime;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'change username successfully',
        })

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.post('/change-date-of-birth', Auth.Authentication, async (req, res) => {
    try {
        const date = req.body.dateOfBirth as DateOfBirthType;
        const user = req.User as UserSchemaType;

        if (!date) {
            return res.status(401).json({
                success: false,
                message: 'invalid date',
            });
        }

        user.dateOfBirth = date;
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'change dateOfBirth successfully',
        })

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

export default router;
