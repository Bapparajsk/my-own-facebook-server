import { INode, UserSchemaType } from "../interfaces/userSchema.type";

const generateUniqueNumber = (): string => {
    const timestamp = Date.now().toString(); // Get the current timestamp
    const randomPart = Math.floor(Math.random() * 1e5).toString().padStart(5, '0'); // Generate a random 5-digit number
    const uniqueNumber = (timestamp + randomPart).slice(-15); // Concatenate and ensure it's 15 digits

    return uniqueNumber;
}

const sendMeassage = (
    userData: UserSchemaType, 
    friendData: UserSchemaType,
    node: INode | undefined, 
    chatId: string, 
    message: string, 
    hashingId: string,
    isMe: boolean,
) => {

    const getPath = (id: string): string => `chat.linkedList.${id}`;

    if(node) {
        node.value.lastMessage = message;
        node.value.lastMessageTime = new Date();
        node.value.isMe = isMe;
        
        // Move the node to the top of the linked list
        if(userData.chat.head !== hashingId) {
            if (node.prev) {
                userData.get(getPath(node.prev)).next = node.next;
            }
            if (node.next) {
                userData.get(getPath(node.next)).prev = node.prev;
            }
            if (userData.chat.head) {
                userData.get(getPath(userData.chat.head)).prev = hashingId;
            }

            node.next = userData.chat.head;
            node.prev = null;
            userData.chat.head = hashingId;
        }
        
    } else {
        const newNode: INode = {
            uid: hashingId,
            value: {
                userId: friendData.get("_id").toString(),
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
            userData.get(getPath(userData.chat.head)).prev = hashingId;
            newNode.next = userData.chat.head;
            userData.chat.head = hashingId;
        }

        userData.set(getPath(hashingId), newNode);
    }    
}

export {
    sendMeassage
}