import {UserSchemaType} from "../interfaces/userSchema.type";
import UserModel from "../model/user.model";

export const StrategyVerify = async (accessToken: any, refreshToken: any, profile: any, done: (arg0: unknown, arg1: unknown) => any) => {
    try {
        const { emails, id, displayName, photos } = profile;

        let user: UserSchemaType | null = null;

        if (emails) {
            user = await UserModel.findOne({ 'emails.value': emails[0].value });
        }

        if (user) {
            return done(null, user);
        }

        const userDetails: Partial<UserSchemaType> = {
            name: displayName,
            socialLink: { githubId: id },
            chat: { head: null, linkedList: {} },
            notification: [],
        };

        if (photos && photos.length > 0 && photos[0].value) {
            userDetails.profileImage = { profileImageURL: photos[0].value };
        }

        if (emails && emails.length > 0 && emails[0].value) {
            userDetails.emails = [{ value: emails[0].value }];
        }

        const newUser = new UserModel(userDetails);
        await newUser.save();
        return done(null, newUser);
    } catch (error) {
        console.log(error);
        return done(error, false);
    }
}
