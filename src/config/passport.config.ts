import passport from 'passport';
import UserModel from "../model/user.model";
import { UserSchemaType } from '../interfaces/userSchema.type'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy} from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { StrategyVerify } from '../middleware/AuthenticationCallback';


passport.use(<passport.Strategy>new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
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
                socialLink: { googleId: id },
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
    })
);

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
    scope: ['id', 'displayName', 'photos', 'email'],
}, StrategyVerify ));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, StrategyVerify));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

export default passport;
