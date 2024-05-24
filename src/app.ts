import 'dotenv/config'
import './config/db.config';
import express, {Express} from 'express';
import cors from 'cors';
import logger  from 'morgan';
import helmet from 'helmet';
import authRouter from "./router/auth.router";
import passport from "./config/passport.config";
import session from 'express-session';

const app: Express = express();
const PORT = Number(process.env.PORT) || 8000;

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

app.use('/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Listening on port http://127.0.0.1:${PORT}`);
});
