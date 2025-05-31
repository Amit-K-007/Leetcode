import { createClient, RedisClientType } from "redis";

let client: RedisClientType | undefined;

export async function getRedisClient() {
    if(!client) {
        client = createClient({
            url: process.env.CENTRAL_REDIS_URL
        });

        client.on('error', async (error) => {
            console.error('Redis Client Error:', error);
            client = undefined;
        });

        await client.connect();
        console.log('Redis connected successfully');
    }
    return client;
}
