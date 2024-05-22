import { Document } from 'mongoose'

export interface User extends Document {
    name: string
    email: string[]
    password: string
    profileImage: string
    post: Post[]
    reel: Post[]
    friends: Friend[]
    friendRequest: Friend[]
    friendRequestSend: Friend[]
    createdAt: Date
}

export interface Post {
    name: string
    description: string
    like: number
    comment: number
    share: number
    contain: string
}

export interface Friend {
    name: string
    image: string
}
