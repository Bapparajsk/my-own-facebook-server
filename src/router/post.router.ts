import express = require("express");
import Auth from '../middleware/auth';
import { putObjectURL, getObjectURL } from "../lib/awsS3";
import jwt from 'jsonwebtoken';
import PostModel from "../model/post.model";
import {PostSchemaType} from "../interfaces/postSchema.type";
import {UserSchemaType} from "../interfaces/userSchema.type";

const router = express.Router();

interface AccessTokenPayload {
    key: string
    createAt: Date
}

router.get("/create-url", Auth.Authentication, async (req, res) => {
    try {
        const { fileName, contentType, userName } = req.body;
        let key : string = `post/${contentType === 'video/mp4' ? 'video' : 'image'}/${userName}-${Date.now()}-${fileName}`;
        const url = await putObjectURL(key, contentType);

        const accessToken = jwt.sign({ key, createAt: Date.now() }, process.env.JWT_SECRET!, {expiresIn : '1d'});

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

        const { key, createAt } = jwt.verify(accessToken, process.env.JWT_SECRET!) as AccessTokenPayload;
        const contentUrl = await getObjectURL(key);
        const user = req.User as UserSchemaType;

        const newPost = new PostModel({
            userId: user._id,
            name: user.name,
            imageUrl: user.profileImage.profileImageURL,
            createdAt: createAt,
            contentUrl: contentUrl,
            description,
        });

        user.post.push({postId: newPost._id});
        await user.save();
        await newPost.save();

        // todo add task queue, all friend notify to new post are upload

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
})

export default router;
