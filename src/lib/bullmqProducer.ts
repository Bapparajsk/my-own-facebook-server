import { newChatNotificationQueue, newPostNotificationQueue } from '../config/bullmq.config';


export const addTaskInQueueFromNewChatNotification = async (token: string, name: string, message: string, imageUrl: string | undefined) => {
    try {
        await newChatNotificationQueue.add('sendNotification', {token, name, message, imageUrl});
    } catch (error) {
        console.log('cannot addTaskInQueue ');
    }
}

export const addTaskInQueueFromNewPostNotification = async () => {

}
