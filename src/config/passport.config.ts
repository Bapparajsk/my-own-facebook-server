import passport from 'passport';
import UserModel from "../model/user.model";
import { UserSchemaType } from '../interfaces/userSchema.type'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy} from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { StrategyVerify } from '../middleware/AuthenticationCallback';
import {NextFunction, Request, Response} from "express";
import { createFrommUserVerification } from "../helper/jsonwebtoken";
import {UserPayload} from "../@types/types";
import { uploadImageToS3 } from '../lib/awsS3';

passport.use(<passport.Strategy>new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: 'http://localhost:8000/auth/google/callback'
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
                active: true,
                nameUpdateTime: new Date(),
                socialLink: { googleId: id },
                chat: { head: null, linkedList: {} },
            };

            if (photos && photos.length > 0 && photos[0].value) {
                 // upload image to aws s3
                const imageUrl = await uploadImageToS3(photos[0].value, displayName);
                userDetails.profileImage = { profileImageURL: imageUrl };
                userDetails.profileImage = { profileImageURL: photos[0].value };
            }

            if (emails && emails.length > 0 && emails[0].value) {
                userDetails.emails = [{ value: emails[0].value, isPrimary: false }];
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
    callbackURL: 'http://localhost:8000/auth/github/callback',
    scope: ['id', 'displayName', 'photos', 'email'],
}, StrategyVerify ));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: 'http://localhost:8000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, StrategyVerify));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

export const authenticateAndRedirect = (strategy: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        passport.authenticate(strategy, (err: any, user: Express.User, info: any) => {
            if (err || !user) {
                return res.redirect("http://localhost:3000/sign-up?invalid=true");
            }
            req.logIn(user, (err) => {
                if (err) {
                    return res.redirect("http://localhost:3000/sign-up?invalid=true");
                }

                const { _id, name } = user as UserSchemaType;
                const token = createFrommUserVerification(<UserPayload>{ userId: _id, userName: name });
                return res.redirect(`http://localhost:3000/verify?token=${token}`);
            });
        })(req, res, next);
    };
};

export default passport;
