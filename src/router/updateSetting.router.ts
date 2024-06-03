import express from "express";
import Auth from "../middleware/auth";
import {UserSchemaType} from "../interfaces/schema.type";
import {sendOtp} from "../helper/sendOTP";

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
})

export default router;
