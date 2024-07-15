import {
    newChatNotificationQueue,
    newPostNotificationQueue,
    friendNotificationQueue
} from '../config/bullmq.config';
import {FriendsType, NotificationType, UserSchemaType} from "../interfaces/userSchema.type";
import Map from '../lib/activeUserList';
import io from '../bin/www';
import UserModel from '../model/user.model';


export const addTaskInQueueFromNewChatNotification = async (token: string, name: string, message: string, imageUrl: string | undefined) => {
    try {
        await newChatNotificationQueue.add('newChatNotificationQueue', {token, name, message, imageUrl});
    } catch (error) {
        console.log('cannot addTaskInQueue ');
    }
}

export const addTaskInQueueFromFriendNotification = async (notification: NotificationType, token: string | null, id: string) => {
    try {
        const userId = Map.userListByUserId.get(id);

        if (userId !== undefined) {
            const socketId = io.sockets.sockets.get(userId);
            if (socketId) {
                socketId.emit('friendnotification', notification);
                return;
            }
        }

        if (token !== null) {
            notification.token = token;
            const s = await friendNotificationQueue.add('friendNotificationQueue', notification);
        }

    } catch (error) {
        console.log('cannot addTaskInQueue');
    }
}

export const addTaskInQueueFromNewPostNotification = async (friends : Map<string, FriendsType>, id: string, name: string, image: string | undefined) => {
    try {

        friends.forEach(async (friend) => {
            const userId = Map.userListByUserId.get(friend.userId);

            if (userId !== undefined) {
                const socketId = io.sockets.sockets.get(userId);
                if (socketId) {
                    socketId.emit('postnotification', {name: friend.name});
                    return;
                }
            }

            const f = await UserModel.findById(friend.userId);
            if (f) {
                const token = f.notificationToken;
                if (token) {

                    const notification: NotificationType = {
                        userId: id,
                        name,
                        image,
                        createdAt: new Date(),
                        description: "New Post",
                        Type: "video",
                        isvew: false,
                    };
                    const s = await newPostNotificationQueue.add('newPostNotificationQueue', notification);
                }
            }
        });
    } catch (error) {
        console.log('cannot addTaskInQueue');
    }
}