import express from 'express';
import Auth from '../middleware/auth';
import UserModel from "../model/user.model";
import {FriendsType, NotificationType, UserSchemaType} from "../interfaces/userSchema.type";
import {addTaskInQueueFromFriendNotification} from "../lib/bullmqProducer";

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
            UserData.friendRequestSend = new Map<unknown, FriendsType>();
        }

        if(!FriendData.friendRequest) {
            FriendData.friendRequest = new Map<unknown, FriendsType>();
        }

        UserData.friendRequestSend.set(FriendData._id, {
            userId: FriendData._id,
            name: FriendData.name,
            image: FriendData.profileImage.profileImageURL || undefined
        });

        FriendData.friendRequest.set(UserData._id, {
            userId: UserData._id,
            name: UserData.name,
            image: UserData.profileImage.profileImageURL || undefined
        });

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
            userId: friendData._id,
            name: friendData.name,
            image: friendData.profileImage.profileImageURL
        });

        friendData.friends.set(user._id, {
            userId: user._id,
            name: user.name,
            image: user.profileImage.profileImageURL
        });

        // delete from Request list
        user.friendRequest.delete(friendId);
        friendData.friendRequestSend.delete(user._id);

        const notification: NotificationType = {
            userId: user._id,
            name: user.name,
            image: user.profileImage.profileImageURL || undefined,
            createdAt: new Date(),
            description: 'accepted your friend request.',
            Type: 'reject friend request'
        }

        await addTaskInQueueFromFriendNotification(notification, friendData.notificationToken, friendData._id);
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
            userId: UserData._id,
            name: UserData.name,
            image: UserData.profileImage.profileImageURL || undefined,
            createdAt: new Date(),
            description: 'rejected your friend request.',
            Type: 'reject friend request'
        }

        await addTaskInQueueFromFriendNotification(notification, friendData.notificationToken, friendData._id);
        friendData.notification.push(notification);

        UserData.friendRequest.delete(friendId);
        friendData.friendRequestSend.delete(UserData._id);


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

export { router };
