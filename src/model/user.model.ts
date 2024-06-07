import {model, Schema} from "mongoose";
import { UserSchemaType, OtpSchema, DateOfBirthType, NotificationType } from '../interfaces/userSchema.type'
import bcrypt from "bcrypt";

const OtpSchema = new Schema<OtpSchema>({
    otp: { type: String, default: null },
    value: { type: String, default: null }
});

const DateOfBirthSchema = new Schema<DateOfBirthType>({
    day: { type: Number, required: false },
    month: { type: Number, required: false },
    year: { type: Number, required: false }
});

const NotificationSchema = new Schema<NotificationType>({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String || undefined },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    Type: { type: String, required: true },
});

const FriendSchema = new Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String || undefined }
});

const userSchema: Schema<UserSchemaType> = new Schema({
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    nameUpdateTime: { type: Date, required: true, default: Date.now },
    dateOfBirth: { type: DateOfBirthSchema, default: {} },
    notificationToken: { type: String, required: false, default: null },
    emails: [ { value: { type: String, required: true }} ],
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
    otp: {
        email: { type: OtpSchema, default: {} },
        phoneNumber: { type: OtpSchema, default: {} }
    },
    post: [{ postId: { type: String, ref: 'Post', required: true } }],
    reel: [{ reelId: { type: String, ref: 'Reel', required: true } }],
    friends: { type: Map, of: FriendSchema, default: {} },
    friendRequest: { type: Map, of: FriendSchema, default: {} },
    friendRequestSend: { type: Map, of: FriendSchema, default: {} },
    chat: [{
        chatId: { type: String, ref: 'Chat', required: true },
        userId: { type: String, ref: 'Friend', required: true },
        name: { type: String, required: true },
        profileImage: { type: String, required: false },
    }],
    notification: [{ type: NotificationSchema, default: null }],
    createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
    const user = this as UserSchemaType;

    if (!user.isModified("password")) return next();

    try {
        console.log('hash password')
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    } catch (err) {
        console.log('err', err);
    }finally {
        next();
    }
});

const UserModel = model<UserSchemaType>('User', userSchema);

export default UserModel;
