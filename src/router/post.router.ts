import express from "express";
import Auth from '../middleware/auth';
import { putObjectURL, getObjectURL } from "../lib/awsS3";
import jwt from 'jsonwebtoken';
import PostModel from "../model/post.model";
import {UserSchemaType} from "../interfaces/userSchema.type";
import {setNewItemInRedis, getNewPost } from "../lib/redis";
import { PostSchemaType } from "../interfaces/postSchema.type";
import Post from "../model/post.model";
import {updatePost} from "../utils/valediction";

const router = express.Router();

interface AccessTokenPayload {
    key: string
    createAt: Date
    contentType: string
}

router.get('/', Auth.Authentication, async (req: express.Request, res: express.Response) => {
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

        const hasNext = totalDocuments > ((page + 1) * 10);

        let responseData = [...cachedData, ...newPostInDb];

        responseData = responseData.map(async (post) => ({...post, contentUrl: await getObjectURL(post.contentUrl)}))

        return res.status(200).json({
            success: true,
            data: responseData,
            hasNext
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
        let key : string = `post/${contentType === 'video/mp4' ? 'video' : 'image'}/${userName}-${Date.now()}-${fileName}`;
        const url = await putObjectURL(key, contentType);

        const accessToken = jwt.sign({ key, createAt: Date.now(), contentType }, process.env.JWT_SECRET!, {expiresIn : '1d'});

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
    try {
        const { accessToken, description } = req.body;

        const { key, createAt, contentType } = jwt.verify(accessToken, process.env.JWT_SECRET!) as AccessTokenPayload;
        
        const user = req.User as UserSchemaType;
        const newPost = new PostModel({
            userId: user._id,
            name: user.name,
            imageUrl: user.profileImage.profileImageURL,
            createdAt: createAt,
            contentUrl: key,
            contentType,
            description,
        });

        user.post.push({postId: newPost._id as string});
        await user.save();
        await newPost.save();

        // todo add task queue, all friend notify to new post are upload
        setNewItemInRedis(newPost).catch(error => console.log(error));

        return res.status(200).json({
            success: true,
            message: 'Successfully created!',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});


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
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: 'internal server error'
        })
    }
});


export default router;
