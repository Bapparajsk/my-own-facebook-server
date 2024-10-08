import { Router, Request, Response } from 'express';
import Auth from "../middleware/auth";
import { UserSchemaType } from "../interfaces/userSchema.type";
import { UserPayload } from "../@types/types";
import { sendOtp } from "../helper/sendOTP";
import { createJwtFromUser } from "../helper/jsonwebtoken";
import {getObjectURL} from "../lib/awsS3";
import redis from "../config/redis.config";

const router = Router();

const getUser = (user: UserSchemaType) => {
    const {
        _id,
        name,
        active,
        dateOfBirth,
        emails,
        profileImage,
        post,
        reel,
        chat,
        like,
        role,
    } = user;

    return {
        _id,
        name,
        active,
        dateOfBirth,
        emails,
        profileImage,
        post,
        reel,
        chat,
        like,
        role,
    };
}

router.get('/', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;
        let cash: any =  await redis.get(`user:${user._id}`);

        if (cash) {
            return res.status(200).json({
                success: true,
                message: 'Successfully getting user',
                user: JSON.parse(cash)
            });
        }

        cash = getUser(user);

        if (cash.profileImage.profileImageURL && !cash.profileImage.profileImageURL.startsWith('http')) {
            cash.profileImage.profileImageURL = await getObjectURL(cash.profileImage.profileImageURL);
        }

        redis.set(`user:${user._id}`, JSON.stringify(cash), 'EX', 60 * 60 * 24); // 1 day

        return res.status(200).json({
            success: true,
            message: 'Successfully getting user',
            user: cash
        });

    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: "internal server error",
        });
    }
});

router.post('/verify_update', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const { data } = req.body;
        const user = req.User as UserSchemaType;

        if (data.name) {
            user.name = data.name;
        }

        user.role = data.role;
        user.dateOfBirth = data.dateOfBirth;
        user.activitys.push({
            lable: "user-details",
            activity: 'credentiaslsUpdate',
            createdAt: new Date(),
            message: 'update role and dateOfBirth'
        })

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Successfully updated update',
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'internal server error'
        })
    }
});

router.post('/add_new_password', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const { password } = req.body;

        const user = req.User as UserSchemaType;
        if (user.password) {
            return res.status(401).json({
                success: false,
                message: 'passwords do not set',
            })
        }

        user.password = password;
        user.activitys.push({
            lable: "password",
            activity: "set-new-password",
            createdAt: new Date(),
            message: 'password added'
        });

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Successfully deleted update',
        })
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'internal server error'
        })
    }
});

router.get("/verify_successful", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;

        const userData = getUser(user);

        const token = createJwtFromUser({ userId: user._id, userName: user.name });

        user.activitys.push({
            lable: "user-details",
            activity: 'login',
            createdAt: new Date(),
            message: 'login successfully'
        })

        user.save().catch(err => console.log(err));

        return res.status(200).json({
            success: true,
            message: 'Successfully get user',
            user: userData,
            app_token: token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'internal server error'
        })
    }
});

router.get("/get_all_post", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;

        return res.status(200).json({
            success: true,
            message: 'Successfully get all post',
            post: user.post
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'internal server error'
        })
    }
});

router.get("/notification", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 0;
        const limit = parseInt(req.query.limit as string) || 10;
        const user = req.User as UserSchemaType;

        const notification = user.notification.slice(page * limit, (page + 1) * limit);

        return res.status(200).json({
            success: true,
            message: 'Successfully get notification',
            notification: notification,
            nextPage: (user.notification.length > (page + 1) * limit)
        });
    } catch (error) {
        console.log(error);
        return res.status(500).send({
            success: false,
            message: 'internal server error'
        })
    }
});


export default router;
