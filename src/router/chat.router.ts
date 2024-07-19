import { Router, Request, Response } from "express";
import Auth from '../middleware/auth';
import { ChatModel } from "../model/chat.model";
import { UserSchemaType } from "../interfaces/userSchema.type";
import UserModel from "../model/user.model";
import hashId from "../lib/userHashId";


const router = Router();

router.get("/", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        // const page = parseInt(req.query.page as string, 10) || 1;
        // const limit = parseInt(req.query.limit as string, 10) || 5;

        const user = req.User as UserSchemaType;
        const friends: {userId: string, name: string, image: string | undefined}[] = [];

        user.friends.forEach( async (fri) => {
            const hashingId = await hashId(user._id as string , fri.userId);
            const chat = await ChatModel.findOne({ hashId: hashingId });
            if(!chat) {
                friends.push({
                    userId: fri.userId,
                    name: fri.name,
                    image: fri.image,
                });
            }
        })

        return res.status(200).json({
            success: true,
            message: 'Successfully get friends',
            friends
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

router.get("/get_chat", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const uid = req.query.uid as string;
        const user = req.User as UserSchemaType;

        if (!uid) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user id'
            });
        }

        const friend = await UserModel.findById(uid).select('name active role profileImage');

        if (!friend) {
            return res.status(404).json({
                success: false,
                message: 'Invalid user id'
            });
        }

        const hashingId = await hashId(user._id as string, uid);
        const chat = await ChatModel.findOne({ hashId: hashingId });
        
        if (chat) {
            chat.read[user._id as string] = chat.chat.length - 1;
            await chat.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Successfully get chat',
            chat: chat ? chat.chat : [],
            chatUser: friend
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

export default router;