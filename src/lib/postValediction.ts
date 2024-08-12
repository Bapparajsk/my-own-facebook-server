import jwt from "jsonwebtoken";
import {AccessTokenPayload} from "../router/post.router";
import {deleteObject} from "./awsS3";
import {PostValedictionModel} from "../model/postValediction.model";

const postUploadSuccessful = async (token: string)=> {
    try {
        const { key } = jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
        if (!key) {
            throw new Error("Invalid access token");
        }

        await PostValedictionModel.findOneAndDelete({token});
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

const postUploadTimeExpire= async (token: string) => {
    try {

        const { key } = jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;
        if (!key) {
            throw new Error("Invalid access token");
        }

        await deleteObject(key);
        await PostValedictionModel.findOneAndDelete({token});
        return true;

    } catch (error) {
        console.error(error);
        return false;
    }
}

const postUploadProcess = async (token: string) => {
    try {

        const { key } = jwt.verify(token, process.env.JWT_SECRET!) as AccessTokenPayload;

        const data = new PostValedictionModel({
            key,
            token,
            createAt: new Date()
        });

        await data.save();
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

const isValid = async (token: string) => {
    try {
        return await PostValedictionModel.findOne({token});
    } catch (error) {
        console.error(error);
        return false;
    }
}

export = {
    postUploadProcess,
    postUploadTimeExpire,
    postUploadFailed: postUploadTimeExpire,
    postUploadSuccessful,
    isValid
}