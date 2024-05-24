import {model, Schema} from "mongoose";
import {UserSchemaType} from '../interfaces/schema.type'
import bcrypt from "bcrypt";

const userSchema: Schema<UserSchemaType> = new Schema({
    name: { type: String, required: true },
    emails: [{ value: { type: String, required: true } }],
    password: { type: String, required: false },
    profileImage: {
        coverImageURL: { type: String, required: false },
        profileImageURL: { type: String, required: false },
    },
    socialLink: {
        googleId: { type: String, required: false },
        githubId: { type: String, required: false },
        facebookId: { type: String, required: false },
    },
    post: [{ postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true } }],
    reel: [{ reelId: { type: Schema.Types.ObjectId, ref: 'Reel', required: true } }],
    friends: [{ name: { type: String, required: true }, image: { type: String, required: true } }],
    friendRequest: [{ name: { type: String, required: true }, image: { type: String, required: true } }],
    friendRequestSend: [{ name: { type: String, required: true }, image: { type: String, required: true } }],
    createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
    const user = this as UserSchemaType;

    if (!user.isModified("password")) return next();

    try {
        const salt: string = process.env.PASSWORD_SALT!;
        user.password = await bcrypt.hash(user.password, salt);
    } catch (err) {
        console.log('err', err);
    }finally {
        next();
    }
});

const UserModel = model<UserSchemaType>('User', userSchema);

export default UserModel;
