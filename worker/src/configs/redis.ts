import { createClient, RedisClientType } from "redis";

interface RedisConfig {
    key: string;
    url: string;
}

const clients: Map<string, RedisClientType> = new Map();

export async function getRedisClient(config: RedisConfig) {
    let client = clients.get(config.key);

    if (!client) {
        client = createClient({
            url: config.url,
        });

        client.on("error", async (error) => {
            console.error("Redis Client Error:", error);
            clients.delete(config.key);
        });

        await client.connect();
        console.log(`Redis (${config.key}) connected successfully`);
        clients.set(config.key, client);
    }

    return client;
}

export async function closeAllRedisClients(): Promise<void> {
    for (const [key, client] of clients) {
        try {
            await client.quit();
            console.log(`Redis (${key}) disconnected`);
        } catch (error) {
            console.error(`Error disconnecting Redis (${key}):`, error);
        }
    }
    clients.clear();
}
