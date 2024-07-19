import { Worker, WorkerOptions } from 'bullmq';
import { messaging } from "../config/firebase.config"
import {NotificationType} from "../interfaces/userSchema.type";
import UserModel from '../model/user.model';
import Map from '../lib/activeUserList';
import io from '../bin/www';

// Define the connection options
const connection = {
    port: Number.parseInt(process.env.REDIS_PORT || "6379"), // Redis port
    host: process.env.REDIS_HOST || "127.0.0.1", // Redis host
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
    console.log(`Job failed with id ${job?.id}`, err);
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
    console.log(`Job failed with id ${job?.id}`, err);
});

const worker3 = new Worker('newPostNotificationQueue', async job => {

    const { id, time } = job.data;


    const user = await UserModel.findById(id).select('name friends profileImage.profileImageURL');

    if (!user) return;

    const notification : NotificationType = {
        userId: id,
        name: user.name,
        image: user.profileImage.profileImageURL || undefined,
        createdAt: time,
        description: "New Post",
        Type: "post",
        isvew: false,
    }

    user.friends.forEach(async (value) => {
        const friend = await UserModel.findById(value.userId).select('notificationToken, notification');

        console.log('newPostNotificationQueue', friend);
        
        if (friend) {
            const userId = Map.userListByUserId.get(friend._id as string);

            friend.notification.push(notification);

            if (userId) {
                const socketId = io.sockets.sockets.get(userId);
                if (socketId) {
                    socketId.emit('postnotification', notification);
                    return;
                }
            } 
            else if (friend.notificationToken) {
                const message = {
                    notification: {
                        title: "New Notification",
                        body: notification.description,
                    },
                    data: {
                        name: notification.name,
                        image: notification.image || "",
                        description: notification.description,
                        createdAt: notification.createdAt.toDateString(),
                        Type: notification.Type
                    },
                    token: friend.notificationToken
                };

                const ss =  await messaging.send(message);
            }

            await friend.save();
        }
    });
}, workerOptions);

worker3.on('failed', (job, err) => {
    console.log(`Job failed with id ${job?.id}`, err);
});