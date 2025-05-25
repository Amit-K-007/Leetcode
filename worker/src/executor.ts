import { getRedisClient } from "./configs/redis";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { promisify } from "util";
import { z } from "zod";
import {
  IntegerSchema,
  IntegerArraySchema,
  StringSchema,
  StringArraySchema,
  CharacterSchema,
  CharacterArraySchema,
} from "./schemas/schema";
import { LanguageHandler, languageHandlers } from "./handlers/handler";
import { initSandbox, cleanupSandbox } from "./sandbox";

dotenv.config();

// Interfaces for queue data
interface Submission {
  questionId: string;
  lang: "CPP" | "JAVA" | "PYTHON";
  dataInput: string;
  userCode: string;
  systemCode: string;
  paramType: string[];
  returnType: string;
  userId: string;
}

interface ExecutionResult {
  submissionId: string;
  userId: string;
  questionId: string;
  status: "success" | "error" | "timeout" | "runtime_error" | "internal_error" | "compilation_error";
  output?: string;
  error?: string;
  meta?: Record<string, string>;
}

// Configuration
const REDIS_CONFIG = {
    key: "local",
    url: process.env.LOCAL_REDIS_URL!,
};
const TIMEOUT_SECONDS = 5;
const MEMORY_LIMIT_KB = 256000;
const COMPILE_TIMEOUT_SECONDS = 10;
const META_FILE = "meta.txt";
const COMPILE_META_FILE = "compile_meta.txt";
const BOX_ID = parseInt(process.env.BOX_ID ?? "0", 10);
const SYSTEM_CODE_LANG = "CPP";

const execFileAsync = promisify(execFile);

// Compile code in sandbox
async function compileCode(
    handler: LanguageHandler,
    code: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean,
): Promise<{ status: string; error?: string; meta?: Record<string, string> }> {
    if (!handler.compileCommand) {
        return { status: "OK" }; // No compilation for Python
    }

    const sourceFile = path.join(sandboxPath, "box", handler.sourceFile);
    const metaFile = path.join(sandboxPath, "box", COMPILE_META_FILE);

    try {
        // Write code file
        await fs.writeFile(sourceFile, code);

        // Run compilation in isolate
        const isolateArgs = [
            `--box-id=${boxId}`,
            `--cg`,
            `--cg-mem=${MEMORY_LIMIT_KB}`,
            `--time=${COMPILE_TIMEOUT_SECONDS}`,
            `--wall-time=${COMPILE_TIMEOUT_SECONDS * 1.5}`,
            ...(isUserCode ? [`--meta=${metaFile}`] : []),
            `-E`, `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
            `-p`,
            `--run`,
            `--`,
            ...handler.compileCommand,
        ];

        await execFileAsync("isolate", isolateArgs, {
            cwd: path.join(sandboxPath, "box"),
        });

        // Read meta-file
        let meta: Record<string, string> = {};
        if(isUserCode) {
            const metaContent = await fs.readFile(metaFile, "utf-8");
            meta = metaContent
              .split("\n")
              .filter((line) => line.includes(":"))
              .reduce((acc, line) => {
                const [key, value] = line.split(":", 2);
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
        }

        return { status: "OK", meta };
    } catch (error: any) {
        let status = "compilation_error";
        let errorMessage = error.message ?? "Compilation failed";

        // Check meta-file for details
        try {
            const metaContent = await fs.readFile(metaFile, "utf-8");
            const meta = metaContent
              .split("\n")
              .filter((line) => line.includes(":"))
              .reduce((acc, line) => {
                const [key, value] = line.split(":", 2);
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);

            if (meta.status) {
              if (meta.status === "TO") {
                  status = "timeout";
              } else if (meta.status === "RE") {
                  status = "runtime_error";
              } 
              errorMessage = meta.message || errorMessage;
            }
            return { status, error: errorMessage, meta };
        } catch {
            return { status, error: errorMessage };
        }
    }
}

// Execute code for a single test case
async function executeCode(
    handler: LanguageHandler,
    input: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean,
): Promise<{ output: string; meta: Record<string, string>; status: string; error?: string }> {
    const inputFile = path.join(sandboxPath, "box", "input.txt");
    const outputFile = path.join(sandboxPath, "box", "output.txt");
    const metaFile = path.join(sandboxPath, "box", META_FILE);

    try {
        // Write input to file
        await fs.writeFile(inputFile, input);

        // Run with isolate
        const isolateArgs = [
          `--box-id=${boxId}`,
          `--cg`,
          `--cg-mem=${MEMORY_LIMIT_KB}`,
          `--time=${TIMEOUT_SECONDS}`,
          `--wall-time=${TIMEOUT_SECONDS * 1.5}`,
          ...(isUserCode ? [`--meta=${metaFile}`] : []),
          `--stdin=input.txt`,
          `--stdout=output.txt`,
          `--run`,
          `--`,
          ...handler.runCommand,
        ];

        await execFileAsync("isolate", isolateArgs, {
          cwd: path.join(sandboxPath, "box"),
        });

        const output = await fs.readFile(outputFile, "utf-8");

        let meta: Record<string, string> = {};
        if(isUserCode) {
          const metaContent = await fs.readFile(metaFile, "utf-8");
          meta = metaContent
            .split("\n")
            .filter((line) => line.includes(":"))
            .reduce((acc, line) => {
              const [key, value] = line.split(":", 2);
              acc[key] = value;
              return acc;
            }, {} as Record<string, string>);
        }
          
        return { output, meta, status: meta.status || "OK" };
    } catch (error: any) {
        let status = "error";
        let errorMessage = error.message ?? "Unknown error";

        // Check meta-file for details
        try {
            const metaContent = await fs.readFile(metaFile, "utf-8");
            const meta = metaContent
              .split("\n")
              .filter((line) => line.includes(":"))
              .reduce((acc, line) => {
                const [key, value] = line.split(":", 2);
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);

            if(meta.status) {
                if(meta.status === "TO") {
                    status = "timeout";
                } else if(meta.status === "RE") {
                    status = "runtime_error";
                } 
                errorMessage = meta.message || errorMessage;
            }
            return { output: "", meta, status, error: errorMessage };
        } catch {
            return { output: "", meta: {}, status, error: errorMessage };
        }
    }
}

function validateField(testcase: string, requiredType: string): string {
  let schema: z.ZodSchema;

  switch (requiredType) {
    case "integer":
      schema = IntegerSchema;
      break;
    case "integer[]":
      schema = IntegerArraySchema;
      break;
    case "string":
      schema = StringSchema;
      break;
    case "string[]":
      schema = StringArraySchema;
      break;
    case "character":
      schema = CharacterSchema;
      break;
    case "character[]":
      schema = CharacterArraySchema;
      break;
    default:
      throw new Error(`Unsupported requiredType from database: ${requiredType}`);
  }

  const parseResult = schema.safeParse(testcase);
  if (!parseResult.success) {
    throw new Error(`Validation failed for ${requiredType}: ${parseResult.error.message}`);
  }
  return parseResult.data;
}

async function processSubmission(submission: Submission, boxId: number, sandboxPath: string): Promise<ExecutionResult> {
    const submissionId = uuidv4();
    const result: ExecutionResult = {
        submissionId,
        userId: submission.userId,
        questionId: submission.questionId,
        status: "success",
    };

    try {
        const userHandler = languageHandlers[submission.lang]("userCode");
        const systemHandler = languageHandlers[SYSTEM_CODE_LANG]("systemCode");
        if (!userHandler || !systemHandler) {
            throw new Error("Unsupported code language");
        }

        const { dataInput, paramType, returnType } = submission;

        const testcases = dataInput.split("\n").filter((line) => line.trim());
        if(testcases.length % paramType.length != 0) {
            throw new Error("Number of testcases not matching");
        }
        for(let i = 0; i < testcases.length; i++) {
            const j = i % paramType.length;
            testcases[i] = validateField(testcases[i], paramType[j]);
        }

        // Assume twoSum function; customize per questionId if needed
        const functionName = "twoSum";
        
        // Compile user code
        const userWrappedCode = userHandler.wrapCode(submission.userCode, functionName, paramType, returnType);
        console.log(`Compiling user code for submission ${submission.questionId}`);
        const userCompileResult = await compileCode(userHandler, userWrappedCode, boxId, sandboxPath, false);
        console.log("User code compilation:", userCompileResult);
        if (userCompileResult.status !== "OK") {
            result.status = userCompileResult.status as ExecutionResult["status"];
            result.error = userCompileResult.error;
            result.meta = userCompileResult.meta;
            return result;
        }

        // Compile system code
        const systemWrappedCode = systemHandler.wrapCode(submission.systemCode, functionName, paramType, returnType);
        console.log(`Compiling system code for submission ${submission.questionId}`);
        const systemCompileResult = await compileCode(systemHandler, systemWrappedCode, boxId, sandboxPath, true);
        console.log("System code compilation:", systemCompileResult);
        if (systemCompileResult.status !== "OK") {
            result.status = "internal_error";
            result.error = `System code compilation failed: ${systemCompileResult.error}`;
            result.meta = systemCompileResult.meta;
            return result;
        }

        for (let i = 0; i < testcases.length; i = i + paramType.length) {
            let input = testcases[i];
            for(let j = i + 1; j < i + paramType.length; j++) {
                input += ('\n' + testcases[j]);
            }

            const userCodeOutput = await executeCode(userHandler, input, boxId, sandboxPath, true);
            if (userCodeOutput.status !== "OK") {
                result.status = userCodeOutput.status as ExecutionResult["status"];
                result.error = userCodeOutput.error ?? `Execution failed with status ${userCodeOutput.status}`;
                result.meta = userCodeOutput.meta;
                break;
            }

            result.meta = userCodeOutput.meta; // Store last meta for success case

            const systemCodeOutput = await executeCode(systemHandler, input, boxId, sandboxPath, false);
            if (systemCodeOutput.status !== "OK") {
                result.status = systemCodeOutput.status as ExecutionResult["status"];
                result.error = systemCodeOutput.error ?? `Execution failed with status ${systemCodeOutput.status}`;
                result.meta = systemCodeOutput.meta;
                break;
            }

            const userSolution = userCodeOutput.output.split("-->").pop()
            const systemSolution = systemCodeOutput.output.split("-->").pop()

            console.log("----------------------------------")
            console.log(input);
            console.log("\n", userSolution);
            console.log("\n", systemSolution);
            console.log("\n", userSolution == systemSolution);
            console.log("----------------------------------");
        }
      } catch (error) {
          console.log("Error while processing", error)
          result.status = "error";
          result.error = error instanceof Error ? error.message : "Unknown error";
      }

    return result;
}

async function startContainer() {
    console.log(`Container started with box-id=${BOX_ID}...`);
    let sandboxPath: string | undefined;

    try {
        // Initialize sandbox
        sandboxPath = await initSandbox(BOX_ID);
        console.log(`Sandbox initialized at ${sandboxPath}`);

        const redisClient = await getRedisClient(REDIS_CONFIG);
        while (true) {
            try {
              // Pull from local submission queue
              const submission = await redisClient.brPop("LOCAL_SUBMISSION_QUEUE", 0);
              if (!submission?.element) {
                  console.log(`No submission received (box-id=${BOX_ID})`);
                  continue;
              }

              // Parse submission
              let parsedSubmission: Submission;
              parsedSubmission = JSON.parse(submission.element) as Submission;

              console.log(`Processing submission ${parsedSubmission.questionId} in box-id=${BOX_ID}`);
              console.log(parsedSubmission);
              // Process submission
              const result = await processSubmission(parsedSubmission, BOX_ID, sandboxPath);

              // Push result to local result queue
              await redisClient.lPush("LOCAL_RESULT_QUEUE", JSON.stringify(result));
              console.log(`Result pushed for submission ${result.submissionId} (box-id=${BOX_ID})`);
            } catch (error) {
                console.error(`Processing error (box-id=${BOX_ID}):`, error);
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after delay
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

startContainer();