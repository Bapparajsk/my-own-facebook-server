import { Socket } from 'socket.io';
import Map from '../lib/activeUserList';
import { addTaskInQueue } from '../lib/bullmqProducer';
import { ChatModel } from "../model/chat.model";
import userHashId from "../lib/userHashId";
import UserModel from "../model/user.model";
import {UserSchemaType} from "../interfaces/schema.type";


export function handleConnection(socket: Socket) {
    socket.on('newUser', async (userId: string) => {
        Map.userListBySocketId.set(socket.id, userId);
        Map.userListByUserId.set(userId, socket.id);
        console.log("new user connect", userId);
        try {
            const user = await UserModel.findById(userId) as UserSchemaType;
            if (!user) return;
            user.active = true;
            await user.save();
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('disconnect', async () => {

        const userId = Map.userListBySocketId.get(socket.id);
        console.log("user disconnect", userId);

        if (userId) {
            Map.userListBySocketId.delete(socket.id);
            Map.userListByUserId.delete(userId);
        }

        try {
            const user = await UserModel.findById(userId) as UserSchemaType;
            if (!user) return;
            user.active = false;
            await user.save();
        } catch (error) {
            console.log(error);
        }
    });

    socket.on('send-message', async ({friendId, message}) => {
        try {
            const userId = Map.userListBySocketId.get(socket.id)!;
            const hashingId = await userHashId(userId, friendId);

            // Fetch user and friend data concurrently
            const [userData, friendData] = await Promise.all([
                UserModel.findById(userId).select('_id name profileImage chat'),
                UserModel.findById(friendId).select('_id name profileImage chat notificationToken')
            ]);

            if (!userData || !friendData) throw new Error('User or friend not found');

            // Find or create chat in a single query using upsert
            let chat = await ChatModel.findOneAndUpdate(
                { hashId: hashingId },
                { $setOnInsert: { hashId: hashingId, chat: [] } },
                { new: true, upsert: true }
            );

            // Check if chat is newly created
            const isNewChat = chat.chat.length === 0;

            if (isNewChat) {
                // Add chat references to both users
                userData.chat.push({
                    chatId: chat._id,
                    userId: friendData._id,
                    name: friendData.name,
                    profileImage: friendData.profileImage.profileImageURL
                });

                friendData.chat.push({
                    chatId: chat._id,
                    userId: userData._id,
                    name: userData.name,
                    profileImage: userData.profileImage.profileImageURL
                });

                // Save user data concurrently
                await Promise.all([userData.save(), friendData.save()]);
            }

            // Add message to chat
            chat.chat.push({ name: friendData.name, message });
            await chat.save();

            // Get friend's socket ID
            const friendSocketID = Map.userListByUserId.get(friendId);
            if (friendSocketID) {
                socket.to(friendSocketID).emit('message-sent', { friendId: userData._id, message });
            } else {

                //send notification in friend browser using firebase
                if (friendData.notificationToken !== null) {
                    addTaskInQueue(friendData.notificationToken, userData.name, message, userData.profileImage.profileImageURL)
                        .catch((error) => console.log("notification can't send"));
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
}
