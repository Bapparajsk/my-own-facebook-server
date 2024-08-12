import express from 'express';
import Auth from '../middleware/auth';
import UserModel from "../model/user.model";
import {FriendsType, NotificationType, UserSchemaType} from "../interfaces/userSchema.type";
import {addTaskInQueueFromFriendNotification} from "../lib/bullmqProducer";
import { getObjectURL } from '../lib/awsS3';

const router = express.Router();

router.put('/send-request', Auth.Authentication , async (req: express.Request, res: express.Response) => {
    try {
        const { friendId } = req.body;
        const FriendData = await UserModel.findById(friendId).select('_id name profileImage');
        const UserData = req.User as UserSchemaType;

        if (!FriendData) {
            return res.status(400).json({
                success: false,
                message: 'User not found',
            })
        }

        if (!UserData.friendRequestSend) {
            UserData.friendRequestSend = new Map<string, FriendsType>();
        }

        if(!FriendData.friendRequest) {
            FriendData.friendRequest = new Map<string, FriendsType>();
        }

        UserData.friendRequestSend.set(FriendData._id as string, {
            userId: FriendData._id as string,
            name: FriendData.name,
            image: FriendData.profileImage.profileImageURL || undefined
        });

        FriendData.friendRequest.set(UserData._id as string, {
            userId: UserData._id as string,
            name: UserData.name,
            image: UserData.profileImage.profileImageURL || undefined
        });

        if (!UserData.activitys) {
            UserData.activitys = [];
        }

        if (!FriendData.activitys) {
            FriendData.activitys = [];
        }

        UserData.activitys.push({
            lable: "friend",
            activity: "friendRequestSend",
            createdAt: new Date(),
            message: `send friend request to ${FriendData.name}`
        });

        FriendData.activitys.push({
            lable: "friend",
            activity: "reciveFriendRequest",
            createdAt: new Date(),
            message: `received friend request from ${UserData.name}`
        })

        await UserData.save();
        await FriendData.save();

        return res.status(200).json({
            success: true,
            message: 'friend request send Successfully',
        });

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Something went wrong',
        });
    }
});

router.patch('/accept-request', Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const { friendId } = req.body;

        const user = req.User as UserSchemaType;
        const friendData = await UserModel.findById(friendId);

        if (!friendData) {
            return res.status(400).json({
                success: false,
                message: 'friend not found',
            })
        }

        user.friends.set(friendId, {
            userId: friendData._id as string,
            name: friendData.name,
            image: friendData.profileImage.profileImageURL
        });

        friendData.friends.set(user._id as string, {
            userId: user._id as string,
            name: user.name,
            image: user.profileImage.profileImageURL
        });

        // delete from Request list
        user.friendRequest.delete(friendId);
        friendData.friendRequestSend.delete(user._id as string);

        user.activitys.push({
            lable: "friend",
            activity: "friendRequestAccept",
            createdAt: new Date(),
            message: `accept friend request from ${friendData.name}`
        });

        friendData.activitys.push({
            lable: "friend",
            activity: "friendRequestAccept",
            createdAt: new Date(),
            message: `accept friend request from ${user.name}`
        })

        const notification: NotificationType = {
            userId: user._id as string,
            name: user.name,
            image: user.profileImage.profileImageURL || undefined,
            createdAt: new Date(),
            description: 'accepted your friend request.',
            Type: "friendRequestReject",
            isvew: false
        }

        await addTaskInQueueFromFriendNotification(notification, friendData.notificationToken, friendData._id as string);
        friendData.notification.push(notification);

        await user.save();
        await friendData.save();

        return res.status(201).json({
            success: true,
            message: 'Successfully add new Friend!',
        });

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Something went wrong',
        });
    }
});

router.patch('/reject-request', Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const { friendId } = req.body;
        const UserData = req.User as UserSchemaType;

        const friendData = await UserModel.findById(friendId);

        if (!friendData) {
            return res.status(400).json({
                success: false,
                message: 'friend not found',
            })
        }

        const notification: NotificationType = {
            userId: UserData._id as string,
            name: UserData.name,
            image: UserData.profileImage.profileImageURL || undefined,
            createdAt: new Date(),
            description: 'rejected your friend request.',
            Type: "friendRequestReject",
            isvew: false
        }

        await addTaskInQueueFromFriendNotification(notification, friendData.notificationToken, friendData._id as string);
        friendData.notification.push(notification);

        UserData.friendRequest.delete(friendId);
        friendData.friendRequestSend.delete(UserData.get("_id").toString());

        UserData.activitys.push({
            lable: "friend",
            activity: "friendRequestReject",
            createdAt: new Date(),
            message: `reject friend request from ${friendData.name}`
        });

        friendData.activitys.push({
            lable: "friend",
            activity: "friendRequestReject",
            createdAt: new Date(),
            message: `reject friend request from ${UserData.name}`
        });

        await UserData.save();
        await friendData.save();

        return res.status(200).json({
            success: true,
            message: 'Successfully removed friend request',
        });

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Something went wrong',
        });
    }
});

router.get('/get-all', Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const user = req.User as UserSchemaType;
        const env = req.query.env as string | undefined;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const page = parseInt(req.query.page as string, 10) || 1;
        const isAll = req.query.all as string | undefined;

        console.log(1);
        

        if (!['send-request', 'friends', 'request', undefined].includes(env)) {
            return res.status(400).json({ success: false, message: 'Invalid query parameter' });
        }

        let friendsQuery: any = {};

        console.log(2);
        

        switch (env) {
            case 'send-request':
            case undefined:
                friendsQuery = {
                    _id: { 
                        $nin: [
                            ...Array.from(user.friends.keys()),
                            ...Array.from(user.friendRequest.keys()),
                            ...Array.from(user.friendRequestSend.keys()),
                            user._id
                        ]
                    }
                };
                break;

            case 'friends':
                friendsQuery = { _id: { $in: Array.from(user.friends.keys()) } };
                break;

            case 'request':
                friendsQuery = { _id: { $in: Array.from(user.friendRequest.keys()) } };
                break;
        }

        console.log(3);
        

        let friends: any = [];

        if (isAll === "true") {
            friends = await UserModel.find(friendsQuery)
            .select('_id name role profileImage active')
        }
        else {
            friends = await UserModel.find(friendsQuery)
            .select('_id name role profileImage active')
            .skip((page - 1) * limit)
            .limit(limit);

        }

        console.log(4);
        

        for(let i = 0; i < friends.length; i++) {
            if (friends[i].profileImage?.profileImageURL && !friends[i].profileImage.profileImageURL.startsWith('http')) {
                friends[i].profileImage.profileImageURL = await getObjectURL(friends[i].profileImage.profileImageURL);
            }
        }

        console.log(5);
        
    
        return res.status(200).json({
            success: true,
            message: 'Successfully getting all friends',
            friends
        });

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Something went wrong',
        });
    }
});

router.get('/get', Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const friendId = req.query.friendId as string;

        const friendData = await UserModel.findById(friendId)
            .select("_id name profileImage post reel friends createdAt");

        if (!friendData) {
            return res.status(404).send({
                success: false,
                message: 'friend not found',
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Successfully getting friend request',
            friendData
        });

    } catch (error) {
        console.log(error)
        res.status(400).send({
            success: false,
            message: 'Something went wrong',
        });
    }
});

export { router };
