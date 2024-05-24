"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("./config/db.config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const auth_router_1 = __importDefault(require("./router/auth.router"));
const passport_config_1 = __importDefault(require("./config/passport.config"));
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 8000;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000', // Allow only this origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods
    credentials: true, // Allow cookies to be sent
}));
app.use((0, morgan_1.default)('dev'));
app.use((0, helmet_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(passport_config_1.default.initialize());
app.use(passport_config_1.default.session());
app.use('/auth', auth_router_1.default);
app.listen(PORT, () => {
    console.log(`Listening on port http://127.0.0.1:${PORT}`);
});
