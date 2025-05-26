import { getRedisClient } from "./configs/redis";
import dotenv from "dotenv";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { promisify } from "util";
import { LanguageHandler, languageHandlers } from "./handlers/handler";
import { initSandbox, cleanupSandbox } from "./sandbox";
import { validateField } from "./schemas/validator";

dotenv.config();

interface Submission {
    questionId: string;
    language: "CPP" | "JAVA" | "PYTHON";
    functionName: string;
    dataInput: string;
    userCode: string;
    systemCode: string;
    paramType: string[];
    returnType: string;
    isAnswer: boolean;
    userId: string;
}

enum Status {
    Success = "success",
    Error = "error",
    Timeout = "timeout",
    RuntimeError = "runtime_error",
    InternalError = "internal_error",
    CompilationError = "compilation_error",
    WrongAnswer = "wrong_answer",
}

interface LastTestCase {
    number: number;
    input: string;
    output?: string;
    expectedOutput?: string;
    status: Status;
    error?: string;
}

interface ExecutionResult {
    submissionId: string;
    userId: string;
    questionId: string;
    status: Status;
    code_answer: string[];
    std_output_list: string[];
    expected_code_answer: string[];
    execution_time: string[];
    execution_memory: string[];
    correctTestCases: number;
    totalTestCases: number;
    lastTestCase?: LastTestCase;
    error?: string;
    errors?: string[];
}

const REDIS_CONFIG = {
    key: "local",
    url: process.env.LOCAL_REDIS_URL!,
};
const TIMEOUT_SECONDS = 3;
const MEMORY_LIMIT_KB = 256000;
const COMPILE_TIMEOUT_SECONDS = 5;
const PROCESS_LIMIT = 1;
const META_FILE = "meta.txt";
const COMPILE_META_FILE = "compile_meta.txt";
const BOX_ID = parseInt(process.env.BOX_ID ?? "0", 10);
const SYSTEM_CODE_LANGUAGE = "CPP";

const execFileAsync = promisify(execFile);

async function compileCode(
    handler: LanguageHandler,
    code: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean,
): Promise<{ status: Status; error?: string; meta?: Record<string, string> }> {
    if (!handler.compileCommand) {
        return { status: Status.Success }; // No compilation for Python
    }

    const sourceFile = path.join(sandboxPath, "box", handler.sourceFile);
    const metaFile = path.join(sandboxPath, "box", COMPILE_META_FILE);

    try {
        await fs.writeFile(sourceFile, code);

        const isolateArgs = [
            `--box-id=${boxId}`,
            `--cg`,
            `--cg-mem=${MEMORY_LIMIT_KB}`,
            `--time=${COMPILE_TIMEOUT_SECONDS}`,
            `--wall-time=${COMPILE_TIMEOUT_SECONDS * 1.5}`,
            `--processes=${PROCESS_LIMIT}`,
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

        return { status: Status.Success, meta };
    } catch (error: any) {
        let status = Status.CompilationError;
        let errorMessage = error.message ?? "Compilation failed";

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
              status = meta.status === "TO" ? Status.Timeout : meta.status === "RE" ? Status.RuntimeError : Status.CompilationError; 
              errorMessage = meta.message || errorMessage;
            }
            return { status, error: errorMessage, meta };
        } catch {
            return { status, error: errorMessage };
        }
    }
}

async function executeCode(
    handler: LanguageHandler,
    input: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean,
): Promise<{ output: string; meta: Record<string, string>; status: Status; error?: string }> {
    const inputFile = path.join(sandboxPath, "box", "input.txt");
    const outputFile = path.join(sandboxPath, "box", "output.txt");
    const metaFile = path.join(sandboxPath, "box", META_FILE);

    try {
        await fs.writeFile(inputFile, input);

        const isolateArgs = [
          `--box-id=${boxId}`,
          `--cg`,
          `--cg-mem=${MEMORY_LIMIT_KB}`,
          `--time=${TIMEOUT_SECONDS}`,
          `--wall-time=${TIMEOUT_SECONDS * 1.5}`,
          `--processes=${PROCESS_LIMIT}`,
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
          
        return { output, meta, status: Status.Success };
    } catch (error: any) {
        let status = Status.Error;
        let errorMessage = error.message ?? "Unknown error";

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
                status = meta.status === "TO" ? Status.Timeout : meta.status === "RE" ? Status.RuntimeError : Status.Error;
                errorMessage = meta.message || errorMessage;
            }
            return { output: "", meta, status, error: errorMessage };
        } catch {
            return { output: "", meta: {}, status, error: errorMessage };
        }
    }
}

async function processSubmission(submission: Submission, boxId: number, sandboxPath: string): Promise<ExecutionResult> {
    const submissionId = uuidv4();
    const result: ExecutionResult = {
        submissionId,
        userId: submission.userId,
        questionId: submission.questionId,
        status: Status.Success,
        code_answer: [],
        std_output_list: [],
        expected_code_answer: [],
        correctTestCases: 0,
        totalTestCases: 0,
        execution_time: [],
        execution_memory: [],
        errors: [],
    };

    try {
        const { questionId, language, userCode, systemCode, functionName, dataInput, paramType, returnType } = submission;
        
        const userHandler = languageHandlers[language]("userCode");
        const systemHandler = languageHandlers[SYSTEM_CODE_LANGUAGE]("systemCode");
        if (!userHandler || !systemHandler) {
          result.status = Status.Error;
          result.error = `Unsupported code language: ${language} or ${SYSTEM_CODE_LANGUAGE}`;
          return result;
        }


        const testcases = dataInput.split("\n").filter((line) => line.trim());
        if(testcases.length % paramType.length != 0) {
          result.status = Status.Error;
          result.error = "Number of test case lines does not match paramType length";
          return result;
        }
        result.totalTestCases = testcases.length / paramType.length;

        for(let i = 0; i < testcases.length; i++) {
            const j = i % paramType.length;
            try {
              testcases[i] = validateField(testcases[i], paramType[j]);
            } catch (error) {
              result.status = Status.Error;
              result.error = error instanceof Error ? `Validation failed for test case ${i + 1}: ${error.message}` : "Validation error";
              return result;
            }
        }
        
        const userWrappedCode = userHandler.wrapCode(userCode, functionName, paramType, returnType);
        console.log(`Compiling user code for submission ${questionId}`);
        const userCompileResult = await compileCode(userHandler, userWrappedCode, boxId, sandboxPath, true);
        console.log("User code compilation:", userCompileResult);
        if (userCompileResult.status !== Status.Success) {
            result.status = userCompileResult.status;
            result.error = userCompileResult.error ?? "User code compilation failed";
            return result;
        }

        const systemWrappedCode = systemHandler.wrapCode(systemCode, functionName, paramType, returnType);
        console.log(`Compiling system code for submission ${questionId}`);
        const systemCompileResult = await compileCode(systemHandler, systemWrappedCode, boxId, sandboxPath, false);
        console.log("System code compilation:", systemCompileResult);
        if (systemCompileResult.status !== Status.Success) {
            result.status = Status.InternalError;
            result.error = systemCompileResult.error ?? "System code compilation failed";
            return result;
        }

        for (let i = 0; i < testcases.length; i += paramType.length) {
            const testCaseNumber = i / paramType.length + 1;
            const input = testcases.slice(i, i + paramType.length).join("\n");

            try {
                console.log(`Executing user code for test case ${testCaseNumber}`);
                const userCodeOutput = await executeCode(userHandler, input, boxId, sandboxPath, true);
                if (userCodeOutput.status !== Status.Success) {
                    result.status = result.status === Status.Success ? userCodeOutput.status : result.status;
                    result.errors!.push(`Test case ${testCaseNumber}: ${userCodeOutput.error ?? userCodeOutput.status}`);
                    result.code_answer.push(userCodeOutput.status.toUpperCase());
                    result.std_output_list.push("");
                    result.expected_code_answer.push("");
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    continue;
                }

                console.log(`Executing system code for test case ${testCaseNumber}`);
                const systemCodeOutput = await executeCode(systemHandler, input, boxId, sandboxPath, false);
                if (systemCodeOutput.status !== Status.Success) {
                    result.status = Status.Error;
                    result.errors!.push(`Test case ${testCaseNumber}: System code ${systemCodeOutput.status}`);
                    result.code_answer.push("");
                    result.std_output_list.push("");
                    result.expected_code_answer.push("");
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    continue;
                }

                const userSolution = userCodeOutput.output.split("{{CODE_ANSWER}}");
                const systemSolution = systemCodeOutput.output.split("{{CODE_ANSWER}}");

                if (userSolution.length !== 2 || systemSolution.length !== 2) {
                    result.status = Status.Error;
                    result.errors!.push(`Test case ${testCaseNumber}: Invalid output format`);
                    result.code_answer.push("");
                    result.std_output_list.push("");
                    result.expected_code_answer.push("");
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    continue;
                }
                if (userSolution[1].trim() === systemSolution[1].trim()) {
                   result.correctTestCases++; 
                }
                result.std_output_list.push(userSolution[0].trim());
                result.code_answer.push(userSolution[1].trim());
                result.expected_code_answer.push(systemSolution[1].trim());
                result.execution_time.push(userCodeOutput.meta.time ?? "0");
                result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
            } catch(error) {
                result.status = Status.Error;
                result.errors!.push(`Test case ${testCaseNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
                result.code_answer.push("");
                result.std_output_list.push("");
                result.expected_code_answer.push("");
                result.execution_time.push("0");
                result.execution_memory.push("0");
            }
        }

        if (result.errors!.length > 0 && result.status === Status.Success) {
          result.status = Status.Error;
          result.error = "One or more test cases failed";
        }
      } catch (error) {
          console.log("Error while processing", error)
          result.status = Status.Error;
          result.error = error instanceof Error ? error.message : "Unknown error";
      }

    return result;
}

async function processAnswer(submission: Submission, boxId: number, sandboxPath: string): Promise<ExecutionResult> {
    const submissionId = uuidv4();
    const result: ExecutionResult = {
        submissionId,
        userId: submission.userId,
        questionId: submission.questionId,
        status: Status.Success,
        code_answer: [],
        std_output_list: [],
        expected_code_answer: [],
        execution_time: [],
        execution_memory: [],
        correctTestCases: 0,
        totalTestCases: 0,
        errors: [],
    };

    try {
        const { questionId, language, userCode, systemCode, functionName, dataInput, paramType, returnType } = submission;
        
        const userHandler = languageHandlers[language]("userCode");
        if (!userHandler) {
            result.status = Status.Error;
            result.error = `Unsupported code language: ${language}`;
            return result;
        }

        const testcases = dataInput.split("\n").filter((line) => line.trim());
        const expectedOutputs = systemCode ? systemCode.split("\n").filter((line) => line.trim()) : [];
        
        if (testcases.length % paramType.length !== 0) {
            result.status = Status.Error;
            result.error = "Number of test case lines does not match paramType length";
            return result;
        }
        result.totalTestCases = testcases.length / paramType.length;
    
        if (expectedOutputs.length !== result.totalTestCases) {
            result.status = Status.Error;
            result.error = `Expected ${result.totalTestCases} outputs, got ${expectedOutputs.length}`;
            return result;
        }

        const userWrappedCode = userHandler.wrapCode(userCode, functionName, paramType, returnType);
        console.log(`Compiling user code for submission ${questionId}`);
        const userCompileResult = await compileCode(userHandler, userWrappedCode, boxId, sandboxPath, true);
        console.log("User code compilation:", userCompileResult);
        if (userCompileResult.status !== Status.Success) {
            result.status = userCompileResult.status;
            result.error = userCompileResult.error ?? "User code compilation failed";
            result.lastTestCase = {
                number: 0,
                input: "",
                status: userCompileResult.status,
                error: result.error,
            };
            return result;
        }

        for (let i = 0; i < testcases.length; i += paramType.length) {
            const testCaseNumber = i / paramType.length + 1;
            const input = testcases.slice(i, i + paramType.length).join("\n");
            const expectedOutput = expectedOutputs[testCaseNumber - 1].trim();

            try {
                console.log(`Executing user code for test case ${testCaseNumber}`);
                const userCodeOutput = await executeCode(userHandler, input, boxId, sandboxPath, true);
                if (userCodeOutput.status !== Status.Success) {
                    result.status = userCodeOutput.status;
                    result.errors!.push(`Test case ${testCaseNumber}: ${userCodeOutput.error ?? userCodeOutput.status}`);
                    result.code_answer.push(userCodeOutput.status.toUpperCase());
                    result.std_output_list.push("");
                    result.expected_code_answer.push(expectedOutput);
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    result.lastTestCase = {
                        number: testCaseNumber,
                        input,
                        status: userCodeOutput.status,
                        error: userCodeOutput.error ?? userCodeOutput.status,
                    };
                    return result;
                }

                const userSolution = userCodeOutput.output.split("{{CODE_ANSWER}}");
                if (userSolution.length !== 2) {
                    result.status = Status.Error;
                    result.errors!.push(`Test case ${testCaseNumber}: Invalid output format`);
                    result.code_answer.push("");
                    result.std_output_list.push("");
                    result.expected_code_answer.push(expectedOutput);
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    result.lastTestCase = {
                        number: testCaseNumber,
                        input,
                        status: Status.Error,
                        error: "Invalid output format",
                    };
                    return result;
                }
                const userOutput = userSolution[1].trim();
                if (userOutput !== expectedOutput) {
                    result.status = Status.WrongAnswer;
                    result.errors!.push(`Test case ${testCaseNumber}: Wrong answer`);
                    result.code_answer.push(userOutput);
                    result.std_output_list.push(userSolution[0].trim());
                    result.expected_code_answer.push(expectedOutput);
                    result.execution_time.push(userCodeOutput.meta.time ?? "0");
                    result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
                    result.lastTestCase = {
                        number: testCaseNumber,
                        input,
                        output: userOutput,
                        expectedOutput,
                        status: Status.WrongAnswer,
                        error: `Expected ${expectedOutput}, got ${userOutput}`,
                    };
                    return result;
                }

                result.correctTestCases++;
                result.code_answer.push(userOutput);
                result.std_output_list.push(userSolution[0].trim());
                result.expected_code_answer.push(expectedOutput);
                result.execution_time.push(userCodeOutput.meta.time ?? "0");
                result.execution_memory.push(userCodeOutput.meta["max-rss"] ?? "0");
            } catch(error) {
                result.status = Status.Error;
                result.errors!.push(`Test case ${testCaseNumber}: ${error instanceof Error ? error.message : "Unknown error"}`);
                result.code_answer.push("");
                result.std_output_list.push("");
                result.expected_code_answer.push(expectedOutput);
                result.execution_time.push("0");
                result.execution_memory.push("0");
                result.lastTestCase = {
                    number: testCaseNumber,
                    input,
                    status: Status.Error,
                    error: error instanceof Error ? error.message : "Unknown error",
                };
                return result;
            }
        }
    } catch (error) {
        console.log("Error while processing answer", error);
        result.status = Status.Error;
        result.error = error instanceof Error ? error.message : "Unknown error";
        if (!result.lastTestCase) {
            result.lastTestCase = {
                number: 0,
                input: "",
                status: Status.Error,
                error: result.error,
            };
        }
    }
    return result;
}

async function startContainer() {
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
                    : await processSubmission(parsedSubmission, BOX_ID, sandboxPath);
                console.log("###########################################");
                console.log(result);
                console.log("###########################################");
                await redisClient.lPush("LOCAL_RESULT_QUEUE", JSON.stringify(result));
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

startContainer();