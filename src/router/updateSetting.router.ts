import { Router } from "express";
import Auth from "../middleware/auth";
import { DateOfBirthType, UserSchemaType } from "../interfaces/userSchema.type";
import { sendOtp } from "../helper/sendOTP";
import bcrypt from "bcrypt";
import { deleteObject, getObjectURL, putObjectURL } from "../lib/awsS3";
import jwt from "jsonwebtoken";
import redis from "../config/redis.config";

const router = Router();

router.post('/email-otp', Auth.Authentication, async (req, res) => {
    try {
        const email = req.body.email as string;
        const user = req.User as UserSchemaType;

        let isFind = user.emails.find((e) => e.value === email);
        if (isFind) {
            return res.status(400).json({
                success: false,
                message: 'email already exists'
            })
        }

        const mail = await sendOtp(user.name, email);
        if (mail.error || !mail.otp) {
            return res.status(401).json({
                success: false,
                message: 'email are not valid'
            });
        }

        user.otp.email = { otp: mail.otp, value: email };
        user.activitys.push({ lable: "email", activity: "emailOtpSend", createdAt: new Date(), message: `email otp send successfully, email is ${email}` });

        await user.save();

        // Schedule OTP removal after 5 minutes
        setTimeout(async () => {
            user.otp.email = null;
            user.activitys.push({ lable: "email", activity: "emailOtpExprea", createdAt: new Date(), message: `email otp expired, email is ${email}` });
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
        const email = user.otp.email?.value;

        if (!email) {
            return res.status(401).json({
                success: false,
                message: 'email not found'
            });
        }

        user.otp.email = null;
        if (!user.emails) user.emails = new Array<{ value: string, isPrimary: boolean }>();
        user.emails.push({ value: email, isPrimary: false });
        user.activitys.push({ lable: "email", activity: "emailOtpVerify", createdAt: new Date(), message: `email otp verify successfully, email is ${email}` });
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'new email add successfully',
            email: email
        });

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.patch('/change-password', Auth.Authentication, async (req, res) => {
    try {
        const { password, newPassword } = req.body as { password: string, newPassword: string };

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
        user.activitys.push({ lable: "password", activity: "passwordUpdate", createdAt: new Date(), message: `password update successfully` });

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

router.put('/notification-token', Auth.Authentication, async (req, res) => {
    try {
        const notificationToken = req.body.notificationToken as string;
        const user = req.User as UserSchemaType;
        user.notificationToken = notificationToken;
        user.activitys.push({ lable: "notification-token", activity: "notificationTokenUpdate", createdAt: new Date(), message: `notification token add successfully` });
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'notification token add successful',
        })
    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});

router.patch('/change-username', Auth.Authentication, async (req, res) => {
    try {
        const newUsername = req.body.name as string;
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
        user.activitys.push({ lable: "user-details", activity: "nameUpdate", createdAt: new Date(), message: `username update successfully` });
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

router.patch('/change-date-of-birth', Auth.Authentication, async (req, res) => {
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
        user.activitys.push({ lable: "user-details", activity: "dateOfBirthUpdate", createdAt: new Date(), message: `dateOfBirth update successfully` });
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

router.patch('/change-role', Auth.Authentication, async (req, res) => {
    try {
        const role = req.body.role as string;
        const user = req.User as UserSchemaType;

        if (!role || !["Full Stack Developer", "Software Engineering", "Software Developer Engineering", "Development and Operations",
            "Ethical Hacker", "Front end Developer", "Back end Developer", "Others"
        ].includes(role)) {
            return res.status(401).json({
                success: false,
                message: 'invalid role',
            });
        }

        user.role = role;
        user.activitys.push({ lable: "user-details", activity: "roleUpdate", createdAt: new Date(), message: `role update successfully` });
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'change role successfully',
        })

    } catch (error) {
        return res.status(401).send({
            success: false,
            message: 'internal server error',
        })
    }
});


// todo change profile image
router.post('/create-url-profile-image', Auth.Authentication, async (req, res) => {
    try {
        const { fileName, contentType } = req.body as { fileName: string, contentType: string };

        if (contentType && !contentType.startsWith("image/")) return res.status(401).json({ success: false, message: "invalid contentType", });

        const user = req.User as UserSchemaType;

        const key = `profile-images/image/${user.name}-${Date.now()}-${fileName}`;
        const url = await putObjectURL(key, 'image/png');

        const accessToken = jwt.sign({ key, createAt: Date.now(), contentType }, process.env.JWT_SECRET!, { expiresIn: '1d' });

        redis.set(accessToken, key, 'EX', (60 * 60 * 24) + 60); // * 1 day 1 minute in seconds
        user.activitys.push({ lable: "user-details", activity: "profileImageUpdate", createdAt: new Date(), message: `profile image update user created` });

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'change profile image successfully',
            url: url,
            accessToken: accessToken
        })
    } catch (error) {
        console.log(error);
        return res.status(401).send({ success: false, message: 'internal server error', });
    }
});

router.patch('/change-profile-image', Auth.Authentication, async (req, res) => {
    const { accessToken } = req.body as { accessToken: string };

    // Check if accessToken exists
    if (!accessToken) {
        return res.status(401).json({ success: false, message: "Invalid accessToken" });
    }

    try {
        const user = req.User as UserSchemaType;

        // Retrieve key from Redis
        const key = await redis.get(accessToken);
        if (key === null) {
            return res.status(401).json({ success: false, message: "Invalid or expired accessToken" });
        }

        // Check and delete old profile image if necessary
        if (!user.profileImage.profileImageURL?.startsWith("https://")) {
            const oldKey = user.profileImage.profileImageURL;
            if (oldKey) {
                await deleteObject(oldKey); // Delete old profile image if not a valid URL
            }
        }

        // Update user's profile image with the new key
        user.profileImage.profileImageURL = key;
        user.activitys.push({
            lable: "user-details",
            activity: "profileImageUpdate",
            createdAt: new Date(),
            message: `Profile image updated by user`
        });

        // Execute multiple promises in parallel
        const [url] = await Promise.all([
            getObjectURL(key),
            user.save(),           // Save user details
            redis.del(accessToken)  // Delete the access token from Redis
        ]);

        // Success response
        return res.status(200).json({
            success: true,
            message: 'Profile image updated successfully',
            url: url,
        });
    } catch (error) {
        console.error(error);

        // Attempt to clean up by deleting the access token
        await redis.del(accessToken);

        // Return a 500 status for internal server errors
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

export default router;
