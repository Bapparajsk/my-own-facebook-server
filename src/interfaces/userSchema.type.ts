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
    chat: ChatType[]
    notification: NotificationType[]
    like: Set<string>
    createdAt: Date
}
