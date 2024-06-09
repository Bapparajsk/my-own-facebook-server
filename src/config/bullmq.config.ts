import { Queue, QueueOptions } from 'bullmq';

const QueueConfig: QueueOptions = {
    connection: {
        port: Number.parseInt(process.env.REDIS_PORT || "6379"), // Redis port
        host: process.env.REDIS_HOST || "127.0.0.1", // Redis host
    }
}

export const newChatNotificationQueue = new Queue("newChatNotificationQueue", QueueConfig)
export const newPostNotificationQueue = new Queue("newPostNotificationQueue", QueueConfig)
export const friendNotificationQueue = new Queue("friendNotificationQueue", QueueConfig)
