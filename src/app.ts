import 'dotenv/config'
import './config/db.config';
import express, {Express} from 'express';
import cors from 'cors';
import logger  from 'morgan';
import helmet from 'helmet';
import passport from "./config/passport.config";
import session from 'express-session';

import AuthRouter from "./router/auth.router";
import AddRouter from './router/updateSetting.router';
import PostRouter from './router/post.router';
import FriendRouter from './router/friend.router';

const app: Express = express();

// middlewares
app.use(cors({
    origin: 'http://localhost:3000', // Allow only this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods
    credentials: true, // Allow cookies to be sent
}));
app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// route paths
app.use('/auth', AuthRouter);
app.use('/api/add', AddRouter);
app.use('/api/post', PostRouter);
app.use('/api/friend', FriendRouter);

export default app;
