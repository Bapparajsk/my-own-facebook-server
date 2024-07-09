import { INode, UserSchemaType } from "../interfaces/userSchema.type";

const sendMeassage = (
    userData: UserSchemaType, 
    friendData: UserSchemaType,
    node: INode, 
    chatId: string, 
    message: string, 
    hashingId: string,
    isMe: boolean,
) => {
    if(node) {
        node.value.lastMessage = message;
        node.value.lastMessageTime = new Date();
        node.value.isMe = isMe;
        
        if (userData.chat.head != hashingId) {
            node.prev = node.next;
            node.next = userData.chat.head;
            userData.chat.head = hashingId;
        }
        
    } else {
        const newNode: INode = {
            uid: hashingId,
            value: {
                name: friendData.name,
                imgUrl: friendData.profileImage.profileImageURL || undefined,
                lastMessage: message,
                lastMessageTime: new Date(),
                chatId,
                isMe
            },
            next: null,
            prev: null
        };

        if(userData.chat.head === null) {
            userData.chat.head = hashingId;
        } else {
            newNode.next = userData.chat.head;
            userData.chat.head = hashingId;
        }

        userData.set(`chat.linkedList.${hashingId}`, newNode);
    }    
}

export {
    sendMeassage
}