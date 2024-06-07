import {
    newChatNotificationQueue,
    newPostNotificationQueue,
    friendNotificationQueue
} from '../config/bullmq.config';
import {NotificationType} from "../interfaces/userSchema.type";
import Map from '../lib/activeUserList';
import io from '../bin/www';


export const addTaskInQueueFromNewChatNotification = async (token: string, name: string, message: string, imageUrl: string | undefined) => {
    try {
        await newChatNotificationQueue.add('newChatNotificationQueue', {token, name, message, imageUrl});
    } catch (error) {
        console.log('cannot addTaskInQueue ');
    }
}

export const addTaskInQueueFromFriendNotification = async (notification: NotificationType, token: string | null, id: unknown) => {
    try {
        const userId = Map.userListByUserId.get(id as string);

        if (userId !== undefined) {
            const socketId = io.sockets.sockets.get(userId);
            if (socketId) {
                socketId.emit('notification', notification);
                return;
            }
        }

        if (token !== null) {
            notification.token = token;
            const s = await friendNotificationQueue.add('friendNotificationQueue', notification);
            console.log('add noti', s.id);
        }

    } catch (error) {
        console.log('cannot addTaskInQueue');
    }
}
