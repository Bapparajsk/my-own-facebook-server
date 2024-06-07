import { Document } from 'mongoose'

export interface OtpSchema {
    otp: string | null;
    value: string | null;
}

export interface ChatType {
    chatId: unknown
    userId: unknown
    name: string
    profileImage: string | undefined
}

export interface DateOfBirthType {
    day: number,
    month: number,
    year: number
}

export interface NotificationType {
    userId: unknown
    name: string
    image: string
    createdAt: Date
    description: string
    Type: string
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
    post: { postId: unknown }[]
    reel: { reelId: string }[]
    friends: Map<unknown, {userId: unknown, name: string, image: string | undefined}>
    friendRequest: Map<unknown, {userId: unknown, name: string, image: string | undefined}>
    friendRequestSend: Map<unknown, {userId: unknown, name: string, image: string | undefined}>
    chat: ChatType[]
    notification: NotificationType[]
    createdAt: Date
}
