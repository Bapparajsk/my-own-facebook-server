// import app from '../app';
// import { createServer } from "http";
// import { Server } from "socket.io";
// const PORT = Number(process.env.PORT) || 8000;
// const httpServer = createServer(app);
//
// const io = new Server(httpServer, {
//     cors: {
//         origin: 'http://localhost:3000', // Allow only this origin
//         methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allow these HTTP methods
//         credentials: true, // Allow cookies to be sent
//     }
// });
//
// io.on('connection', socket => {
//     console.log(socket.id);
// })
//
// httpServer.listen(PORT, () => {
//     console.log(`Listening on port http://127.0.0.1:${PORT}`);
// });
