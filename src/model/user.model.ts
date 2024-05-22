import {model, Schema} from "mongoose";
import {User} from '../types/schema.type'
import bcrypt from "bcrypt";

const userSchema = new Schema<User>({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: [],
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    profileImage : {
        type: String,
    },
    post: {
        type: []
    },
    reel: {
        type: []
    },
    friends: {
        type: []
    },
    friendRequest: {
        type: []
    },
    friendRequestSend: {
        type: []
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

userSchema.pre("save", async function (next) {
    const user = this as User;

    if (!user.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    } catch (err) {
        console.log('err', err);
    }finally {
        next();
    }
});

const userModel = model<User>('User', userSchema);

export default userModel;
