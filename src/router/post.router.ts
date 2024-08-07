import express, { Router, Request, Response } from "express";
import Auth from '../middleware/auth';
import { putObjectURL, getObjectURL, deleteObject } from "../lib/awsS3";
import jwt from 'jsonwebtoken';
import PostModel from "../model/post.model";
import {UserSchemaType} from "../interfaces/userSchema.type";
import {setNewItemInRedis, getNewPost } from "../lib/redis";
import { PostSchemaType } from "../interfaces/postSchema.type";
import {updatePost} from "../utils/valediction";
import postValediction from "../lib/postValediction";
import UserModel from "../model/user.model";
import { newPostNotificationQueue } from "../config/bullmq.config";

const router = Router();

export interface AccessTokenPayload {
    key: string
    createAt: Date
    contentType: string
}

router.get('/', Auth.Authentication, async (req: Request, res: Response) => {
    try {
        const page = Number.parseInt(req.query.page as string) || 0; // Default to 0 if page is not provided or invalid
        const cachedData = await getNewPost();

        const [newPostInDb, totalDocuments] = await Promise.all([
            PostModel.find()
                .sort({ createdAt: -1 })
                .skip(page * 10)
                .limit(10),
            PostModel.countDocuments()
        ]);
        const hasNext = totalDocuments > ((page + 10) * 10);
        let responseData = [...cachedData, ...newPostInDb];

        
        for (let i = 0; i < responseData.length; i++) {
            responseData[i].contentUrl = await getObjectURL(responseData[i].contentUrl);
            const user = await UserModel.findById(responseData[i].userId).select("active");
            responseData[i].userActive = user?.active || false;
        }

        return res.status(200).json({
            success: true,
            data: responseData,
            hasNext,
            page : hasNext ? page + 1 : 0,
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
        let key : string = `post/${contentType === 'video/mp4' ? 'video' : 'image'}/${userName}-${Date.now()}-${fileName}`;
        const url = await putObjectURL(key, contentType);
        
        const accessToken = jwt.sign({ key, createAt: Date.now(), contentType }, process.env.JWT_SECRET!, {expiresIn : '1d'});
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
        }, (24*60*60*1000) + (60 * 1000)); // 1 day and 1 minute after expire this url

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
            description : description || "tathing to say",
        });

        user.activitys.push({
            lable: "post",
            activity: "postUpload",
            createdAt: new Date(),
            message: `post upload, post id: ${newPost._id}`
        })

        user.post.push({postId: newPost._id as string});
        await user.save();
        await newPost.save();

        // todo add task queue, all friend notify to new post are upload
        setNewItemInRedis(newPost).catch(error => console.log(error));

        await postValediction.postUploadSuccessful(accessToken);
        await newPostNotificationQueue.add('newPostNotificationQueue', {id: user._id, time: Date.now()});
        
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
        user.activitys.push({lable: "post" ,activity: "postRemove", createdAt: new Date(), message: activityMessage("started") });

        try {
            await deleteObject(post.contentUrl);
            user.activitys.push({lable: "post" ,activity: "postRemove", createdAt: new Date(), message: activityMessage("successful") });
        } catch (error) {
            console.error(error);
            user.activitys.push({lable: "post" ,activity: "postRemove", createdAt: new Date(), message: activityMessage("failed") });
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

        const [ isSuccess, message ] = await updatePost(post, event, body) as [boolean, string];

        if (!isSuccess) {
            return res.status(402).json({
                success: false,
                message: message
            })
        }

        return res.status(200).json({
            success: true,
            message: 'post update successfully'
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
})


router.get("/:id", Auth.Authentication, async (req: express.Request, res: express.Response) => {
    try {
        const id = req.params.id;

        const post = await PostModel.findById(id) as PostSchemaType;

        if(!post) {
            return res.status(404).json({
                success: false,
                message: 'invalid id'
            })
        }
        
        post.contentUrl  = await getObjectURL(post.contentUrl);

        return res.status(200).json({
            success: true,
            post,
            message: "post found"
        })

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