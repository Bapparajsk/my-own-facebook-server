import { Document } from 'mongoose'

export interface UserSchemaType extends Document {
    name: string
    emails: { value: string }[]
    password: string
    profileImage: {
        coverImageURL?: string
        profileImageURL?: string
    }
    socialLink: {
        googleId?: string
        githubId?: string
        facebookId?: string
    },
    post: { postId: string }[]
    reel: { reelId: string }[]
    friends: { name: string, image: string }[]
    friendRequest: { name: string, image: string }[]
    friendRequestSend: { name: string, image: string }[]
    createdAt: Date
}
