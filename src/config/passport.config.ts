import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';

console.log("start config")

passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: '/auth/google/callback'
        },
    (accessToken, refreshToken, profile, done) => {
        console.log(profile)
        return done(null, profile);
    })
);

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    callbackURL: '/auth/github/callback',
}, (accessToken: any, refreshToken: any, profile: any, done: (arg0: null, arg1: any) => any) => {
    // console.log(profile);
    return done(null, profile);
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID!,
    clientSecret: process.env.FACEBOOK_APP_SECRET!,
    callbackURL: '/auth/facebook/callback',
}, (accessToken, refreshToken, profile, done) => {
    console.log(profile);
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

export default passport;
