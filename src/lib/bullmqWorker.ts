import { Worker, WorkerOptions } from 'bullmq';
import { messaging } from "../config/firebase.config"

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

const worker = new Worker('sendNotification', async job => {
    console.log('Processing job:', job.data);
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
worker.on('failed', (job, err) => {
    console.error(`Job failed with id ${job?.id}`, err);
});
