import redis from '../config/redis.config';

const redisListId = "newPost";

export const setNewItemInRedis = async (item: any) => {
    try {
        const exists = await redis.exists(redisListId);

        if (exists) {
            await redis.rpush(redisListId, item);
        } else {
            await redis.rpush(redisListId, item);
            await redis.expire(redisListId, 5 * 60);
        }
    } catch (error) {
        console.log(error);
    }
}

export const getNewPost = async () => {
    try {
        const data = await redis.lrange(redisListId, 0, -1);

        return data.map((item: any) => {
            return JSON.parse(item);
        });

    } catch (error) {
        return new Array<string>(0);
    }
}
