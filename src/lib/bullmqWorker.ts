import { Worker, WorkerOptions } from 'bullmq';
import { messaging } from "../config/firebase.config"
import {NotificationType} from "../interfaces/userSchema.type";

// Define the connection options
const connection = {
    host: '127.0.0.1',
    port: 6379,
};

// Define worker options
const workerOptions: WorkerOptions = {
    connection,
    removeOnComplete: { count: 2 }, // Use the correct option name here
};

const worker1 = new Worker('newChatNotificationQueue', async job => {
    const { token, name, message, imageUrl } = job.data;

    const Message = {
        notification: {
            title: "New Notification",
            name,
            body: message,
            photo: imageUrl,
        },
        token
    }

    await messaging.send(Message);
}, workerOptions);

// Handle errors
worker1.on('failed', (job, err) => {
    console.error(`Job failed with id ${job?.id}`, err);
});

const worker2 = new Worker('friendNotificationQueue', async job => {
    const {
        name,
        image,
        description,
        createdAt,
        token,
        Type
    } = job.data as NotificationType;

    console.log('notification queue');

    const message = {
        notification: {
            title: "New Notification",
            body: description, // Use a suitable property for the body
        },
        data: {
            name,
            image: image || "",
            description,
            createdAt: createdAt.toString(),
            Type
        },
        token: token!
    };

    const ss =  await messaging.send(message);
    console.log(" notifiction send ", ss)
}, workerOptions);

worker2.on('failed', (job, err) => {
    console.error(`Job failed with id ${job?.id}`, err);
});
