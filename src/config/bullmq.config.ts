import { Queue, QueueOptions } from 'bullmq';

const QueueConfig: QueueOptions = {
    connection: {
        host: '127.0.0.1',
        port: 6379,
    }
}

export const newChatNotificationQueue = new Queue("newChatNotificationQueue", QueueConfig)
export const newPostNotificationQueue = new Queue("newPostNotificationQueue", QueueConfig)
export const friendNotificationQueue = new Queue("friendNotificationQueue", QueueConfig)
