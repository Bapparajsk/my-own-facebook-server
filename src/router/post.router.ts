import express, { Router, Request, Response } from "express";
import Auth from '../middleware/auth';
import { putObjectURL, getObjectURL, deleteObject } from "../lib/awsS3";
import jwt from 'jsonwebtoken';
import PostModel from "../model/post.model";
import { UserSchemaType } from "../interfaces/userSchema.type";
import { setNewItemInRedis, getNewPost } from "../lib/redis";
import { CommentType, PostSchemaType } from "../interfaces/postSchema.type";
import { updatePost } from "../utils/valediction";
import postValediction from "../lib/postValediction";
import UserModel from "../model/user.model";
import { newPostNotificationQueue } from "../config/bullmq.config";
import redis from '../config/redis.config';
import { rateLimit } from 'express-rate-limit'

const router = Router();

export interface AccessTokenPayload {
    key: string
    createAt: Date
    contentType: string
}

const postLimiter = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 2, // Limit each IP to 1 request per windowMs
    message: "Too many requests from this IP, please try again later."
});

router.get('/', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 0; // Default to 0 if page is not provided or invalid
        const user = req.User as UserSchemaType;
        if (page < 0) {
            return res.status(404).json({
                success: false,
                message: 'invalid page number'
            })
        }

        const cashId = `post-page-${page}`;

        const cash = await redis.get(cashId);

        const totalDocuments = await PostModel.countDocuments();
        const hasNext = totalDocuments > ((page + 10) * 10);

        if (cash) {
            return res.status(200).json({
                success: true,
                data: await JSON.parse(cash),
                hasNext: true,
                page: hasNext ? page + 1 : 0,
            });
        }

        const cachedData = await getNewPost();

        const [newPostInDb] = await Promise.all([
            PostModel.find()
                .sort({ createdAt: -1 })
                .skip(page * 10)
                .limit(10),
        ]);

        let responseData = [...cachedData, ...newPostInDb];


        const ids: string[] = [];

        for (let i = 0; i < responseData.length; i++) {
            const contentUrl = responseData[i].contentUrl;
            let userImageKey = responseData[i].imageUrl as string;

            if (!userImageKey?.startsWith("http")) {
                userImageKey = await getObjectURL(userImageKey);
            }

            responseData[i].contentUrl = await getObjectURL(contentUrl);
            responseData[i].imageUrl = userImageKey;
            ids.push(responseData[i].userId);
        }

        const users = await UserModel.find({ _id: { $in: ids } }).select("active");

        for (let i = 0; i < responseData.length; i++) {
            responseData[i].userActive = users[i]?.active || false;
        }

        redis.set(cashId, JSON.stringify(responseData), 'EX', 60 * 3);

        return res.status(200).json({
            success: true,
            data: responseData,
            hasNext,
            page: hasNext ? page + 1 : 0,
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

router.get("/user-post", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const user = req.User as UserSchemaType;

        let cash = await redis.get(`post-user-${user._id}`);

        if (cash) {
            return res.status(200).json({
                success: true,
                message: 'Successfully get user post',
                post: JSON.parse(cash)
            });
        }

        const post = await PostModel.find({ userId: user._id });

        for (let i = 0; i < post.length; i++) {
            post[i].contentUrl = await getObjectURL(post[i].contentUrl);
        }

        redis.set(`post-user-${user._id}`, JSON.stringify(post), 'EX', 60 * 3);

        return res.status(200).json({
            success: true,
            message: 'Successfully get user post',
            post
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

router.post("/create-url", Auth.Authentication, async (req, res) => {
    try {
        const { fileName, contentType, userName } = req.body;
        const user = req.User as UserSchemaType;
        let key: string = `post/${contentType === 'video/mp4' ? 'video' : 'image'}/${userName}-${Date.now()}-${fileName}`;
        const url = await putObjectURL(key, contentType);

        const accessToken = jwt.sign({ key, createAt: Date.now(), contentType }, process.env.JWT_SECRET!, { expiresIn: '1d' });
        await postValediction.postUploadProcess(accessToken);

        user.activitys.push({
            lable: "post",
            activity: 'postUpload',
            createdAt: new Date(),
            message: `create post url`
        });

        user.save().catch(err => console.log(err));

        setTimeout(async () => {
            await postValediction.postUploadTimeExpire(accessToken);
            user.activitys.push({
                lable: "post",
                activity: 'postUpload',
                createdAt: new Date(),
                message: `post url expire`
            });
            user.save().catch(err => console.log(err));
        }, (24 * 60 * 60 * 1000) + (60 * 1000)); // 1 day and 1 minute after expire this url

        return res.status(200).json({
            success: true,
            message: 'Successfully created!',
            url,
            accessToken
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

router.post('/add-post', Auth.Authentication, async (req, res) => {

    const { accessToken, description } = req.body;

    if (!accessToken) {
        return res.status(404).json({
            success: false,
            message: 'access token is not found'
        })
    }

    if (!await postValediction.isValid(accessToken)) {
        return res.status(404).json({
            success: false,
            message: 'access token is invalid'
        });
    }

    try {
        const { key, createAt, contentType } = jwt.verify(accessToken, process.env.JWT_SECRET!) as AccessTokenPayload;

        if (!key || !createAt || !contentType) {
            return res.status(404).json({
                success: false,
                message: 'invalid access token'
            })
        }

        const user = req.User as UserSchemaType;
        const newPost = new PostModel({
            userId: user._id,
            name: user.name,
            imageUrl: user.profileImage.profileImageURL,
            createdAt: createAt,
            contentUrl: key,
            contentType,
            description: description || "tathing to say",
        });

        user.activitys.push({
            lable: "post",
            activity: "postUpload",
            createdAt: new Date(),
            message: `post upload, post id: ${newPost._id}`
        })

        user.post.push({ postId: newPost._id as string });
        await user.save();
        await newPost.save();

        // todo add task queue, all friend notify to new post are upload
        setNewItemInRedis(newPost).catch(error => console.log(error));

        await postValediction.postUploadSuccessful(accessToken);
        await newPostNotificationQueue.add('newPostNotificationQueue', { id: user._id, time: Date.now() });

        return res.status(200).json({
            success: true,
            message: 'Successfully created!',
        });
    } catch (error) {
        console.log(error);
        await postValediction.postUploadFailed(accessToken);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

router.delete("/delete", Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const id = req.query.id as string;
        const user = req.User as UserSchemaType;

        if (!id) {
            return res.status(404).json({
                success: false,
                message: "id is not found"
            })
        }

        const post = await PostModel.findById(id) as PostSchemaType | undefined;

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "post not found"
            })
        }

        user.post = user.post.filter(post => post.postId !== id);

        const activityMessage = (status: string) => `Post removal ${status}, post ID: ${id}`;
        user.activitys.push({ lable: "post", activity: "postRemove", createdAt: new Date(), message: activityMessage("started") });

        try {
            await deleteObject(post.contentUrl);
            user.activitys.push({ lable: "post", activity: "postRemove", createdAt: new Date(), message: activityMessage("successful") });
        } catch (error) {
            console.error(error);
            user.activitys.push({ lable: "post", activity: "postRemove", createdAt: new Date(), message: activityMessage("failed") });
        } finally {
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: 'post delete successfully'
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
})

router.patch("/update", Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const event = req.query.event as string;
        const id = req.query.id as string;
        const body = req.body;
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "invalid url, update url and try again"
            })
        }

        if (!id) {
            return res.status(404).json({
                success: false,
                message: "id is not found"
            })
        }

        const post = await PostModel.findById(id) as PostSchemaType | undefined;

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "post not found"
            })
        }

        const [isSuccess, message, commentId] = await updatePost(post, event, body) as [boolean, string, string];

        if (!isSuccess) {
            return res.status(402).json({
                success: false,
                message: message
            })
        }

        return res.status(200).json({
            success: true,
            message: 'post update successfully',
            commentId
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
})

router.get("/onepost", postLimiter, async (req, res) => {
    try {
        const id = req.query.postid as string;

        if (!id) {
            return res.status(404).json({ success: false, message: 'ID not found' });
        }

        let post: string | PostSchemaType | null = await redis.get(id);

        if (typeof post === 'string') {
            post = JSON.parse(post) as PostSchemaType;

        } else if (post === null) {
            post = await PostModel.findById(id) as PostSchemaType | null;
            if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
            post.contentUrl = await getObjectURL(post.contentUrl);
            redis.set(id, JSON.stringify(post), 'EX', 60 * 60 * 24);
        }

        post.userId = "undefined";
        post.comments = new Map<string, CommentType>();

        // console.log(post);


        return res.status(200).json({ success: true, post, message: "Post found" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get("/get-comment", Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const id = req.query.id as string;

        if (!id) return res.status(404).json({ success: false, message: "id is not found" });

        let comment: string | Map<string, CommentType> | null = await redis.get(`comment-${id}`);

        if (typeof comment === "string") {
            comment = JSON.parse(comment) as Map<string, CommentType>;
        } else if (comment === null) {
            const post = await PostModel.findById(id) as PostSchemaType | null;
            if (!post) if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

            comment = post.comments;
            redis.set(`comment-${id}`, JSON.stringify(comment));
        }

        console.log(comment);


        return res.status(200).json({ success: true, comment, message: "comment found" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});


router.get("/image/:key", Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {

        const key = req.params.key as string;

        const url = getObjectURL(key);

        return res.status(201).json({
            success: true,
            message: "url created",
            url
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});

export default router;