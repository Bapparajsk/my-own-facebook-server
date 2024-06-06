import { Document } from 'mongoose'

export interface  CommentType {
    userId: string,
    userName: string,
    userImage: string,
    createdAt: Date
    comment: string
}

export interface PostSchemaType extends Document {
    userId: string
    createdAt: Date
    description: string
    contentId: string
    likeCount: number
    commentCount: number
    shareCount: number
    comments: CommentType[]
}
