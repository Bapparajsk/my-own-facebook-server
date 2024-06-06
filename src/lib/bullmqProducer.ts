import bullMq from '../config/bullmq.config';

export interface QueueType {
    token: string
    name: string
    message: string
    imageUrl: string | undefined
}

export const addTaskInQueue = async <QueueType>(token: string, name: string, message: string, imageUrl: string | undefined) => {
    try {
        await bullMq.add('sendNotification', {token, name, message, imageUrl});
    } catch (error) {
        console.log('cannot addTaskInQueue ');
    }
}
