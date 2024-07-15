import { Socket } from 'socket.io';
import Map from '../lib/activeUserList';
import { addTaskInQueueFromNewChatNotification } from '../lib/bullmqProducer';
import { ChatModel } from "../model/chat.model";
import userHashId from "../lib/userHashId";
import UserModel from "../model/user.model";
import {INode, ListNode, UserSchemaType} from "../interfaces/userSchema.type";
import { sendMeassage } from '../lib/io';


export function handleConnection(socket: Socket) {
    socket.on('newUser', async (userId: string) => {
        Map.userListBySocketId.set(socket.id, userId);
        Map.userListByUserId.set(userId, socket.id);

        try {
            const user = await UserModel.findById(userId) as UserSchemaType;
            if (!user) return;
            user.active = true;
            await user.save();
        } catch (error) {
            console.log("error", error);
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
                UserModel.findById(userId),
                UserModel.findById(friendId)
            ]);

            if (!userData || !friendData) throw new Error('User or friend not found');

            // Find or create chat in a single query using upsert
            let chat = await ChatModel.findOneAndUpdate(
                { hashId: hashingId },
                { $setOnInsert: { hashId: hashingId, chat: [] } },
                { new: true, upsert: true }
            );

            let nodewithMe = userData.get(`chat.linkedList.${hashingId}`) as INode;
            let nodewithFriend = friendData.get(`chat.linkedList.${hashingId}`) as INode;
            sendMeassage(userData, friendData, nodewithMe, chat._id as string, message, hashingId, true);
            sendMeassage(friendData, userData, nodewithFriend, chat._id as string, message, hashingId, false);

            chat.chat.push({ name: userData.name, message, time: new Date() });

            await userData.save();
            await friendData.save();

            // Get friend's socket ID
            const friendSocketID = Map.userListByUserId.get(friendId);
            if (friendSocketID) {
                socket.to(friendSocketID).emit('message-sent', { friendId: userData._id, message });
            } else {

                //send notification in friend browser using firebase
                if (friendData.notificationToken !== null) {
                    addTaskInQueueFromNewChatNotification(friendData.notificationToken, userData.name, message, userData.profileImage.profileImageURL)
                        .catch((error) => console.log("notification can't send"));
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    });
}
