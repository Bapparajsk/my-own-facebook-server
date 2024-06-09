import Ioredis from 'ioredis'
import { promisify } from 'util'

const client = new Ioredis({
    port: Number.parseInt(process.env.REDIS_PORT || "6379"), // Redis port
    host: process.env.REDIS_HOST || "127.0.0.1", // Redis host
});

client.on("error", () => {
    console.log('Redis connection failed');
});

client.on("connect", () => {
    console.log('Redis connection connected');
})


export const hsetAsync = promisify(client.hset).bind(client);
export const expireAsync = promisify(client.expire).bind(client);
export default client;
