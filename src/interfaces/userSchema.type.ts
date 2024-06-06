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
    post: { postId: string }[]
    reel: { reelId: string }[]
    friends: { name: string, image: string }[]
    friendRequest: { name: string, image: string }[]
    friendRequestSend: { name: string, image: string }[]
    chat: ChatType[]
    createdAt: Date
}
