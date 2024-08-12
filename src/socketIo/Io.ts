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
            console.log("user connect", socket.id);
            
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
            const userId = Map.userListBySocketId.get(socket.id) as string;
            if (!userId) throw new Error('User not found');
            const hashingId = await userHashId(userId, friendId);

            // // Fetch user and friend data concurrently
            const [userData, friendData] = await Promise.all([
                UserModel.findById(userId),
                UserModel.findById(friendId)
            ]);

            if (!userData || !friendData) throw new Error('User or friend not found');

            // Find or create chat in a single query using upsert
            let chat = await ChatModel.findOne({ hashId: hashingId });

            if (!chat) {
                chat = await ChatModel.create({ hashId: hashingId, chat: [] });
            }

            let nodewithMe = userData.get(`chat.linkedList.${hashingId}`) as INode | undefined;
            let nodewithFriend = friendData.get(`chat.linkedList.${hashingId}`) as INode | undefined;


            sendMeassage(userData, friendData, nodewithMe, chat._id as string, message, hashingId, true);
            sendMeassage(friendData, userData, nodewithFriend, chat._id as string, message, hashingId, false);

            const time = new Date();

            chat.chat.push({ sender: userData._id as string, message, time: time});


            if (chat.read[friendId] === undefined || chat.read[friendId] === chat.chat.length - 2) {
                chat.read[friendId] = chat.chat.length - 1;
            }


            chat.read[userId] = chat.chat.length - 1;

            await userData.save();
            await friendData.save();
            await chat.save();

            // Get friend's socket ID
            const friendSocketID = Map.userListByUserId.get(friendId);
            if (friendSocketID) {

                const data = {
                    senderId: userId,
                    senderName: userData.name,
                    senderImage: userData.profileImage?.profileImageURL,
                    message: message,
                    time: time,
                }

                console.log(data);
                

                socket.to(friendSocketID).emit(`receive-message`, data);
                console.log("message send to friend", friendSocketID);
                
            } else {

                // //send notification in friend browser using firebase
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
