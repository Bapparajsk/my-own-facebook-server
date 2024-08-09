import mongoose, { Document } from 'mongoose'

export interface ListNode {
    userId: string;
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
    userId: string
    name: string
    image: string | undefined
    createdAt: Date
    description: string
    Type: "post" | "comment" | "like" | "friendRequestReject"
    isvew: boolean
    token?: string
}

export interface FriendsType {
    userId: string
    name: string
    image: string | undefined
}

export interface ActivityTypes {
    lable?: "post" | "email" | "friend" | "password" | "notification-token" | "user-details" | "user-details"
    activity: "login" | "online" | "offline" | "post" | "comment" | "like" | "dislike"| "modify-comment" | "delete-comment" | "share" |
        "description" | "friendRequestSend" | "friendRequestAccept" | "friendRequestReject" | "reciveFriendRequest" | "credentiaslsUpdate" |
        "profileImageUpdate" | "coverImageUpdate" | "nameUpdate" | "emailUpdate" | "passwordUpdate" | "dateOfBirthUpdate" | "notificationTokenUpdate" |
        "socialLinkUpdate" | "otpUpdate" | "friendRemove" | "chatRemove" | "notificationRemove" | "likeRemove" | "postRemove" | "reelRemove" |
        "friendRequestRemove" | "friendRequestSendRemove" | "activityRemove" | "uiIdUpdate" | "postUpload" | "emailOtpSend" | "emailOtpVerify" | "emailOtpExprea" |
        "set-new-password"
    createdAt: Date;
    message?: string;
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
    friends: Map<string, FriendsType>
    friendRequest: Map<string, FriendsType>
    friendRequestSend: Map<string, FriendsType>
    chat: resentChatType
    notification: NotificationType[]
    like: Set<string>
    createdAt: Date
    activitys: ActivityTypes[]
    uiId: string | null | undefined
}
