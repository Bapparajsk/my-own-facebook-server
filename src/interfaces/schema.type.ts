import {Document, Schema} from 'mongoose'

export interface OtpSchema {
    otp: string | null;
    value: string | null;
}


export interface UserSchemaType extends Document {
    name: string
    nameUpdateTime?: Date,
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
    createdAt: Date
}
