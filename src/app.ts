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

app.use(cors());
app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'keysdjkdfj',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('http://localhost:3000');
    });
});

app.get('/user', (req, res) => {
    console.log(req.user);
    res.send(req.user);
});

app.listen(PORT, () => {
    console.log(`Listening on port http://127.0.0.1:${PORT}`);
});
