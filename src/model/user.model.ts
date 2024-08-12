import {model, Schema} from "mongoose";
import {
    UserSchemaType,
    OtpSchema,
    DateOfBirthType,
    NotificationType,
    FriendsType,
    INode,
    ListNode,
    resentChatType,
    ActivityTypes
} from '../interfaces/userSchema.type'
import bcrypt from "bcrypt";

const OtpSchema: Schema<OtpSchema> = new Schema<OtpSchema>({
    otp: { type: String, default: null },
    value: { type: String, default: null }
});

const DateOfBirthSchema: Schema<DateOfBirthType> = new Schema<DateOfBirthType>({
    day: { type: Number, required: false },
    month: { type: Number, required: false },
    year: { type: Number, required: false }
});

const NotificationSchema: Schema<NotificationType> = new Schema<NotificationType>({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String || undefined },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, required: true },
    Type: { type: String, required: true },
    isvew: { type: Boolean, default: false },
    token: { type: String, default: null },
});

const FriendSchema: Schema<FriendsType> = new Schema({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String || undefined }
});

const listNodeSchema = new Schema<ListNode>({
    userId: { type: String, required: true },
    name: { type: String, required: true },
    imgUrl: { type: String, default: null },
    lastMessage: { type: String, required: true },
    lastMessageTime: { type: Date, required: true },
    chatId: { type: String, required: true },
    isMe: { type: Boolean, required: true }
});
  
const iNodeSchema = new Schema<INode>({
    uid: { type: String, required: true },
    value: { type: listNodeSchema, required: true },
    next: { type: String, default: null },
    prev: { type: String, default: null }
});
  
const chatSchema = new Schema<resentChatType>({
    head: { type: String, default: null },
    linkedList: { type: Map, of: iNodeSchema, default: {} }
});

const activitySchema: Schema<ActivityTypes> = new Schema<ActivityTypes>({
    lable: { type: String, required: false },
    activity: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    message: { type: String, required: false }
});


const userSchema: Schema<UserSchemaType> = new Schema({
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
    nameUpdateTime: { type: Date, required: true, default: Date.now },
    role: { type: String, required: false },
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
    chat: { type: chatSchema, required: true },
    notification: [{ type: NotificationSchema, default: null }],
    like: { type: Map, default: {}},
    createdAt: { type: Date, default: Date.now },
    activitys: [{ type: activitySchema, default: null }],
    uiId: { type: String, default: null }
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
