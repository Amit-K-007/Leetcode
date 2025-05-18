import { getRedisClient, closeAllRedisClients } from "./configs/redis";
import dotenv from "dotenv";

dotenv.config();

// Redis configurations
const REDIS_CONFIGS = {
    central: {
        key: "central",
        url: process.env.CENTRAL_REDIS_URL!,
    },
    local: {
        key: "local",
        url: process.env.LOCAL_REDIS_URL!,
    },
};

async function runFetcherLoop() {
    console.log("Fetcher loop started...");
    const centralRedis = await getRedisClient(REDIS_CONFIGS.central);
    const localRedis = await getRedisClient(REDIS_CONFIGS.local);

    while(true) {
        try {
            const submission = await centralRedis.brPop("SUBMISSION_QUEUE", 0);
            if (!submission || !submission.element) {
                console.log("No submission received from central queue");
                continue;
            }
            await localRedis.lPush("LOCAL_SUBMISSION_QUEUE", submission.element);
            console.log("Pushed submission to local queue");
        } catch (error) {
            console.error("Fetcher loop error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after delay
        }
    }
}

async function runAggregatorLoop() {
    console.log("Aggregator loop started...");
    const centralRedis = await getRedisClient(REDIS_CONFIGS.central);
    const localRedis = await getRedisClient(REDIS_CONFIGS.local);

    while (true) {
        try {
            const result = await localRedis.brPop("LOCAL_RESULT_QUEUE", 0);
            if (!result || !result.element) {
                console.log("No result received from local queue");
                continue;
            }
            console.log("Pushed result to main queue:", result.element);
        } catch (error) {
            console.error("Aggregator loop error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after delay
        }
    }
}

async function startWorker() {
    console.log("Worker Started...");
    try {
        await Promise.all([
            runFetcherLoop(),
            runAggregatorLoop(),
        ]);
    } catch (error) {
        console.error("Worker error:", error);
        await closeAllRedisClients();
    }
}

startWorker();