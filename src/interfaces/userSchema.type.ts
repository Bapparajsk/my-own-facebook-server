import mongoose, { Document } from 'mongoose'

export interface ListNode {
    name: string;
    imgUrl: string | undefined | null;
    lastMessage: string;
    lastMessageTime: Date;
    chatId: string;
    isMe: boolean;
}

export interface INode {
    uid: string;
    value: ListNode;
    next: string | null;
    prev: string | null;
}

export interface resentChatType {
    head: string | null;
    linkedList: {[key: string]: INode};
}

export interface OtpSchema {
    otp: string | null;
    value: string | null;
}

export interface DateOfBirthType {
    day: number,
    month: number,
    year: number
}

export interface NotificationType {
    userId: unknown
    name: string
    image: string | undefined
    createdAt: Date
    description: string
    Type: string
    token?: string
}

export interface FriendsType {
    userId: unknown
    name: string
    image: string | undefined
}

export interface UserSchemaType extends Document {
    name: string
    active: boolean
    nameUpdateTime: Date,
    role: string,
    dateOfBirth: DateOfBirthType,
    notificationToken: string,
    emails: { value: string }[]
    password: string
    profileImage: {
        coverImageURL?: string
        profileImageURL?: string
    },
    socialLink: {
        googleId?: string
        githubId?: string
        facebookId?: string
    },
    otp: {
        email?: OtpSchema | null
        phoneNumber?: OtpSchema | null
    },
    post: { postId: string }[]
    reel: { reelId: string }[]
    friends: Map<unknown, FriendsType>
    friendRequest: Map<unknown, FriendsType>
    friendRequestSend: Map<unknown, FriendsType>
    chat: resentChatType
    notification: NotificationType[]
    like: Set<string>
    createdAt: Date
}
