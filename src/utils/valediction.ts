import { PostSchemaType, CommentType } from "../interfaces/postSchema.type";
import UserModel from "../model/user.model";
import { UserSchemaType } from "../interfaces/userSchema.type";
import { v4 as uuidv4 } from "uuid";

const set: Set<string> = new Set<string>(
    ["like", "dislike", "comment", "modify-comment", "delete-comment" ,"share", "description"]);

const like = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    if (user.like.has(post._id as string)) {
        return [false, "already liked"];
    }

    post.likeCount = post.likeCount + 1;
    user.like.add(post._id as string);
    return [true, "post liked"];
}

const dislike = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    if (!user.like.has(post._id as string)) {
        return [false, "not liked"];
    }

    post.likeCount = post.likeCount - 1;
    user.like.delete(post._id as string);
    return [true, "post disliked"];
}

const comment = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    const { comment } = body;

    if (!comment) {
        return [false, "invalid comment"];
    }

    const { _id, name, profileImage } = user;
    const newCommentId = uuidv4().toString();
    const newComment: CommentType = {
        id: newCommentId,
        userId: _id as string,
        userName: name,
        userImage: profileImage?.profileImageURL,
        comment,
        createdAt: new Date(),
        modify: new Date()
    }

    post.comments.set(newCommentId, newComment);
    post.commentCount = post.commentCount + 1;
    return [true, "comment added"];
}

const modifyComment = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    const { modifyComment, commentId, } = body;

    if (!modifyComment || !commentId) {
        return [false, "invalid comment"];
    }

    const comment = post.comments.get(commentId);
    if (!comment) {
        return [false, "comment not found"];
    }

    if (comment.userId !== user._id) {
        return [false, "not allowed"];
    }

    comment.comment = modifyComment;
    comment.modify = new Date();
    post.comments.set(commentId, comment);
    return [true, "comment modified"];
}

const deleteComment = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    const { commentId } = body;

    if (!commentId) {
        return [false, "invalid comment id"];
    }

    const comment = post.comments.get(commentId);
    if (!comment) {
        return [false, "comment not found"];
    }

    if (comment.userId !== user._id) {
        return [false, "not allowed"];
    }

    post.comments.delete(commentId);
    post.commentCount = post.commentCount - 1;
    return [true, "comment deleted"];
}

const changeDescription = (post: PostSchemaType, body: any, user: UserSchemaType ): [boolean, string] => {
    const { description } = body;

    if (!description) {
        return [false, "invalid discussion"];
    }

    if (post.userId !== user._id) {
        return [false, "not allowed"];
    }

    post.description = description;
    return [true, "discussion changed"];
}

export const updatePost = async (post: PostSchemaType, event : string, body: any, ): Promise<[boolean, string]> => {
    // if event is not in set then return false
    if (!set.has(event)) return [false, "invalid event"];

    // check if user id is present in body and user is present in database
    const { userId } = body;
    if (!userId) return [false, "user id not found"];

    try {
        const user = await UserModel.findById(userId) as UserSchemaType | undefined;
        if (!user) return [false, "user not found"];

        let message = "";
        switch (event) {
            case "like": {
                const [isSuccess, mes] = like(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break;

            case "dislike": {
                const [ isSuccess, mes ] = dislike(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break;

            case "comment": {
                const [ isSuccess, mes ] = comment(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break;

            case "modify-comment": {
                const [ isSuccess, mes ] = modifyComment(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break;

            case "delete-comment": {
                const [ isSuccess, mes ] = deleteComment(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break

            case "share":
                post.shareCount = post.shareCount + 1;
                message = "post shared";
                break;

            case "description": {
                const [ isSuccess, mes ] = changeDescription(post, body, user);
                if (!isSuccess) {
                    return [false, mes];
                }
                message = mes;
            }
                break;
            // ! default case
            default: {
                return [false, "invalid event"];
            }
        }

        user.activitys.push({
            lable: "post",
            activity: event,
            createdAt: new Date(),
            message: message
        });

        await post.save();
        await user.save();
        return [true, message];
    } catch (error) {
        console.log(error);
        return [false, "internal server error"];
    }
}