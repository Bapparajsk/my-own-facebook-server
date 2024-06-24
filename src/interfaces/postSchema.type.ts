import { Document } from 'mongoose'

export interface  CommentType {
    id: string,
    userId: string,
    userName: string,
    userImage: string,
    createdAt: Date
    modify: Date
    comment: string
}

export interface PostSchemaType extends Document {
    userId: string
    name: string
    imageUrl: string | undefined
    createdAt: Date
    modify: Date
    description: string
    contentUrl: string
    contentType: string
    likeCount: number
    commentCount: number
    shareCount: number
    comments: Map<string, CommentType>
}
