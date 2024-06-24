import {Router, Request, Response} from 'express';
import Auth from "../middleware/auth";
import {UserSchemaType} from "../interfaces/userSchema.type";
import {UserPayload} from "../@types/types";
import {sendOtp} from "../helper/sendOTP";
import {createJwtFromUser} from "../helper/jsonwebtoken";

const router = Router();

const getUser = (user: UserSchemaType) => {
    const {
        name,
        active,
        dateOfBirth,
        emails,
        profileImage,
        post,
        reel,
        friends,
        friendRequest,
        friendRequestSend,
        chat,
        notification,
        like,
        role,
    } = user;

    return {
        name,
        active,
        dateOfBirth,
        emails,
        profileImage,
        post,
        reel,
        friends,
        friendRequest,
        friendRequestSend,
        chat,
        notification,
        like,
        role,
    };
}

router.get('/', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;

        const userData = getUser(user);

        return res.status(200).json({
            success: true,
            message: 'Successfully getting user',
            user: userData
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
        const {data} = req.body;
        const user = req.User as UserSchemaType;
        console.log(data);

        if (data.name) {
            user.name  = data.name;
        }

        user.role = data.role;
        user.dateOfBirth = data.dateOfBirth;

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

        const token = createJwtFromUser({userId: user._id, userName: user.name});

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

export default router;
