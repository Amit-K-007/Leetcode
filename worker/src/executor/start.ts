import { getRedisClient } from "../configs/redis";
import { Submission, REDIS_CONFIG, BOX_ID } from "../sandbox/types";
import { initSandbox, cleanupSandbox } from "../sandbox/sandbox";
import { processSubmission, processAnswer } from "./process";

export async function startContainer(): Promise<void> {
    console.log(`Container started with box-id=${BOX_ID}...`);
    let sandboxPath: string | undefined;

    try {
        sandboxPath = await initSandbox(BOX_ID);
        console.log(`Sandbox initialized at ${sandboxPath}`);

        const redisClient = await getRedisClient(REDIS_CONFIG);
        while (true) {
            try {
                const submission = await redisClient.brPop("LOCAL_SUBMISSION_QUEUE", 0);
                if (!submission?.element) {
                    console.log(`No submission received (box-id=${BOX_ID})`);
                    continue;
                }

                let parsedSubmission: Submission;
                parsedSubmission = JSON.parse(submission.element) as Submission;

                console.log(`Processing submission ${parsedSubmission.questionId} in box-id=${BOX_ID}`);
                const result = parsedSubmission.isAnswer
                    ? await processAnswer(parsedSubmission, BOX_ID, sandboxPath)
                    : await processSubmission(
                          parsedSubmission,
                          BOX_ID,
                          sandboxPath
                      );
                console.log("###########################################");
                console.log(result);
                console.log("###########################################");
                await redisClient.lPush(
                    "LOCAL_RESULT_QUEUE",
                    JSON.stringify(result)
                );
                console.log(`Result pushed for submission ${result.submissionId} (box-id=${BOX_ID})`);
            } catch (error) {
                console.error(`Processing error (box-id=${BOX_ID}):`, error);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
    } catch (error) {
        console.error(`Container error (box-id=${BOX_ID}):`, error);
        if (sandboxPath) {
            await cleanupSandbox(BOX_ID);
        }
        process.exit(1);
    }
}
