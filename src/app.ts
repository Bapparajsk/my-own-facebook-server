import 'dotenv/config'
import './config/db.config';
import express, {Express} from 'express';
import cors from 'cors';
import logger  from 'morgan';
import helmet from 'helmet';
import authRouter from "./router/auth.router";

const app: Express = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/auth', authRouter);

app.listen(PORT, () => {
    console.log(`Listening on port http://127.0.0.1:${PORT}`);
});
