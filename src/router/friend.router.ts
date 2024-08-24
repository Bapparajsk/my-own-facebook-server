import { Router, Request, Response } from 'express';
import Auth from '../middleware/auth';
import UserModel from "../model/user.model";
import { FriendsType, NotificationType, UserSchemaType } from "../interfaces/userSchema.type";
import { addTaskInQueueFromFriendNotification } from "../lib/bullmqProducer";
import { getObjectURL } from '../lib/awsS3';
import PostModel from '../model/post.model';
import redis from '../config/redis.config';
import SocketMap from '../lib/activeUserList';
import io from '../bin/www';
import { Socket } from 'socket.io';

const router = Router();

router.put('/send-request', Auth.Authentication, async (req: Request, res: Response) => {
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

        if (!FriendData.friendRequest) {
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

router.patch('/accept-request', Auth.Authentication, async (req: Request, res: Response) => {
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

router.patch('/reject-request', Auth.Authentication, async (req: Request, res: Response) => {
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
            message: 'internal server error',
        });
    }
});

router.get('/get-all', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;
        const env = req.query.env as string | undefined;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const page = parseInt(req.query.page as string, 10) || 1;
        const isAll = req.query.all as string | undefined;


        if (!['send-request', 'friends', 'request', undefined].includes(env)) {
            return res.status(400).json({ success: false, message: 'Invalid query parameter' });
        }

        let friendsQuery: any = {};

        const re: string[] = [];

        if (env) {
            re.push(env);
        }
        re.push(limit.toString());
        re.push(page.toString());
        if (isAll) {
            re.push(isAll);
        }

        const reData = re.join('-');

        const cacheData = await redis.get(`friend-${user._id}-${reData}`);

        // if (cacheData) {
        //     return res.status(200).json({
        //         success: true,
        //         message: 'Successfully getting all friends',
        //         friends: JSON.parse(cacheData)
        //     });
        // }


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


        // Convert each document to a plain object and add the index
        friends = await Promise.all(friends.map(async (friend: any, index: any) => {
            let friendObj = friend.toObject(); // Convert to plain object
            friendObj.idx = index; // Add the index

            // Check and update the profileImageURL if needed
            if (friendObj.profileImage?.profileImageURL && !friendObj.profileImage.profileImageURL.startsWith('http')) {
                friendObj.profileImage.profileImageURL = await getObjectURL(friendObj.profileImage.profileImageURL);
            }

            return friendObj; // Return the modified object
        }));

        redis.set(`friend-${user._id}-${reData}`, JSON.stringify(friends), 'EX', 60 * 60 * 24).catch((e) => console.log(e));

        console.log(friends);


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

router.get('/get', Auth.Authentication, async (req: Request, res: Response) => {
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
        res.status(400).send({ success: false, message: 'Something went wrong' });
    }
});


router.post("/share-post", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const { friendId, postId } = req.body as { friendId: string; postId: string };

        // Validate input
        if (!friendId || !postId) return res.status(400).json({ success: false, message: 'Invalid request' });

        // Fetch friend and post data concurrently
        const [friendData, postData] = await Promise.all([
            UserModel.findById(friendId),
            PostModel.findById(postId)
        ]);

        // If either friend or post is not found, return 404
        if (!friendData || !postData) return res.status(404).json({ success: false, message: 'Friend or post not found' });

        const userData = req.User as UserSchemaType;
        const socketId = SocketMap.userListByUserId.get(friendId);
        let isSent = false;

        // If friend is connected via socket, send a real-time update
        if (socketId) {
            const socket = io.sockets.sockets.get(socketId);
            console.log(socketId);

            const post = {
                userId: postData.userId,
                userName: postData.name,
                userImage: userData.profileImage.profileImageURL,
                userActive: userData.active,
                postId
            };

            if (socket) {

                socket.emit('new-post', post);
                isSent = true;
            }
        }

        // Prepare a notification for the friend
        const notification: NotificationType = {
            userId: userData._id as string,
            name: userData.name,
            image: friendData.profileImage?.profileImageURL,
            createdAt: new Date(),
            description: 'shared your post.',
            Type: "post",
            isvew: false,
            link: `/share-post?postId=${postId}`
        };

        // If the post was not sent via socket, add it to the queue for sending notification via firebase
        if (!isSent && friendData.notificationToken) {
            await addTaskInQueueFromFriendNotification(notification, friendData.notificationToken, friendData._id as string);
        }

        // Save the notification to the friend's data
        if (!friendData.notification) {
            friendData.notification = [];
        }

        friendData.notification.push(notification);
        await friendData.save();

        return res.status(200).json({ success: true, message: 'Successfully shared post' });

    } catch (error) {
        console.error(error);
        return res.status(400).json({ success: false, message: 'internal server error' });
    }

});

export { router };
