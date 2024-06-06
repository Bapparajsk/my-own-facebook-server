import { Queue, QueueOptions } from 'bullmq';

const QueueConfig: QueueOptions = {
    connection: {
        host: '127.0.0.1',
        port: 6379,
    }
}

const taskQueue = new Queue("notificationQueue", QueueConfig)

export default taskQueue;
