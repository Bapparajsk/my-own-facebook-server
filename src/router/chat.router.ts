import { Router, Request, Response } from "express";
import Auth from '../middleware/auth';
import { ChatModel } from "../model/chat.model";
import { INode, ListNode, UserSchemaType } from "../interfaces/userSchema.type";
import UserModel from "../model/user.model";
import hashId from "../lib/userHashId";
import {  } from "mongoose"

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
        
        const hashingId = hashId(user.get("_id").toString(), uid);
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

router.get("/get_chat_list", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;
        let ch = user.get(`chat.linkedList.${user.chat.head}`) as INode | undefined;

        interface ChatList extends ListNode {
            isActive?: boolean;
        }

        const chats: ChatList[] = [];
        const ids: string[] = [];

        while(ch) {
            const data = ch.value;
            ids.push(data.userId);
            chats.push({
                userId: data.userId,
                name: data.name,
                imgUrl: data.imgUrl,
                lastMessage: data.lastMessage,
                lastMessageTime: data.lastMessageTime,
                chatId: data.chatId,
                isMe: data.isMe,
            });
            ch = user.get(`chat.linkedList.${ch.next}`) as INode | undefined
        }

        if(ids.length > 0) {
            const friends = await UserModel.find({ _id: { $in: ids } }).select('active');
            for (let i = 0; i < ids.length; i++) {
                chats[i].isActive = friends[i]?.active || false;
            }
        }
        
        // console.log(4);
        return res.status(200).json({
            success: true,
            message: 'Successfully retrieved chat list',
            chats: []
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