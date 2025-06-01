import { getRedisClient, closeAllRedisClients } from "./configs/redis";
import prisma, { SubmissionStatus } from "@amit-k/prisma-shared";
import dotenv from "dotenv";
import { Submission, ExecutionResult } from "./sandbox/types"; 

dotenv.config();

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

const statusToSubmissionStatus: Record<string, SubmissionStatus> = {
    success: SubmissionStatus.ACCEPTED,
    error: SubmissionStatus.ERROR,
    timeout: SubmissionStatus.TIME_LIMIT_EXCEEDED,
    runtime_error: SubmissionStatus.RUNTIME_ERROR,
    internal_error: SubmissionStatus.ERROR,
    compilation_error: SubmissionStatus.COMPILATION_ERROR,
    wrong_answer: SubmissionStatus.WRONG_ANSWER,
    memory_limit_exceeded: SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
};

async function runFetcherLoop() {
    console.log("Fetcher loop started...");
    const centralRedis = await getRedisClient(REDIS_CONFIGS.central);
    const localRedis = await getRedisClient(REDIS_CONFIGS.local);

    while(true) {
        try {
            const submission = await centralRedis.brPop("SUBMISSION_QUEUE", 0);
            if (!submission?.element) {
                console.log("No submission received from central queue");
                continue;
            }

            const submissionData: Submission = JSON.parse(submission.element);
            if(submissionData.isAnswer) {
                try {
                    const currentSubmission = await prisma.submission.create({
                        data: {
                            userId: submissionData.userId,
                            problemId: parseInt(submissionData.questionId),
                            code: submissionData.userCode,
                            language: submissionData.language.toUpperCase() as 'JAVA' | 'CPP' | 'PYTHON',
                        },
                    });
                    submissionData.submissionId = currentSubmission.id;
                } catch (dbError) {
                    console.error("DB create error:", dbError);
                    continue;
                }
            }

            await localRedis.lPush("LOCAL_SUBMISSION_QUEUE", JSON.stringify(submissionData));
            console.log("Pushed submission to local queue", JSON.stringify(submissionData));
        } catch (error) {
            console.error("Fetcher loop error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
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
            if (!result?.element) {
                console.log("No result received from local queue");
                continue;
            }

            const resultData: ExecutionResult = JSON.parse(result.element);
            if(resultData.isAnswer) {
                try {
                    await prisma.submission.update({
                        where: {
                            id: resultData.submissionId,
                        },
                        data: {
                            status: statusToSubmissionStatus[resultData.status] ?? "ERROR",
                            executionTime: resultData.execution_time.length
                                ? parseFloat((resultData.execution_time.reduce((sum, time) => sum + parseFloat(time), 0) / resultData.execution_time.length).toFixed(3))
                                : null,
                            executionMemory: resultData.execution_memory.length
                                ? parseFloat(Math.max(...resultData.execution_memory.map(m => parseFloat(m))).toFixed(3))
                                : null,
                            correctTestCases: resultData.correctTestCases,
                            totalTestCases: resultData.totalTestCases,
                        }
                    });
                } catch (dbError) {
                    console.error("DB update error:", dbError);
                    continue;
                }
            }

            await centralRedis.publish("RESULT_CHANNEL", result.element);
            console.log("Published result to RESULT_CHANNEL:", result.element);
        } catch (error) {
            console.error("Aggregator loop error:", error);
            await new Promise((resolve) => setTimeout(resolve, 5000));
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