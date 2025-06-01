import { v4 as uuidv4 } from "uuid";
import { LanguageHandler, languageHandlers } from "../handlers/handler";
import {
    Submission,
    ExecutionResult,
    Status,
    SYSTEM_CODE_LANGUAGE,
} from "../sandbox/types";
import { ExecutionError, handleError } from "../utils/error";
import { validateField } from "../schemas/validator";
import { compileCode } from "./compile";
import { executeTestCase } from "./execute";

export async function validateTestCases(
    dataInput: string,
    paramType: string[],
    validate: boolean
): Promise<{ testcases: string[]; totalTestCases: number }> {
    const testcases = dataInput.split("\n").filter((line) => line.trim());
    if (testcases.length % paramType.length !== 0) {
        throw new ExecutionError(
            Status.Error,
            "Number of test case lines does not match paramType length"
        );
    }
    if (validate) {
        for (let i = 0; i < testcases.length; i++) {
            const j = i % paramType.length;
            try {
                testcases[i] = validateField(testcases[i], paramType[j]);
            } catch (error) {
                throw new ExecutionError(
                    Status.Error,
                    error instanceof Error
                        ? `Validation failed for test case ${
                              Math.floor(i / paramType.length) + 1
                          }: ${error.message}`
                        : "Validation error",
                    Math.floor(i / paramType.length) + 1,
                    testcases
                        .slice(i - (i % paramType.length), i + 1)
                        .join("\n")
                );
            }
        }
    }
    return { testcases, totalTestCases: testcases.length / paramType.length };
}

export async function processTestCases(
    result: ExecutionResult,
    testcases: string[],
    paramType: string[],
    userHandler: LanguageHandler,
    boxId: number,
    sandboxPath: string,
    systemHandler?: LanguageHandler,
    expectedOutputs?: string[],
    stopOnFailure: boolean = false
): Promise<void> {
    for (let i = 0; i < testcases.length; i += paramType.length) {
        const testCaseNumber = i / paramType.length + 1;
        const input = testcases.slice(i, i + paramType.length).join("\n");
        const expectedOutput = expectedOutputs
            ? expectedOutputs[testCaseNumber - 1]?.trim()
            : undefined;

        try {
            console.log(`Executing user code for test case ${testCaseNumber}`);
            const userResult = await executeTestCase(
                result,
                userHandler,
                input,
                testCaseNumber,
                boxId,
                sandboxPath,
                true
            );
            if (userResult.error) {
                handleError(result, userResult.error, testCaseNumber, input);
                if (stopOnFailure) return;
                continue;
            }

            let isCorrect = false;
            if (systemHandler) {
                console.log(`Executing system code for test case ${testCaseNumber}`);
                const systemResult = await executeTestCase(
                    result,
                    systemHandler,
                    input,
                    testCaseNumber,
                    boxId,
                    sandboxPath,
                    false
                );
                if (systemResult.error) {
                    handleError(
                        result,
                        new ExecutionError(
                            Status.Error,
                            `System code ${systemResult.error.status}`,
                            testCaseNumber,
                            input
                        )
                    );
                    if (stopOnFailure) return;
                    continue;
                }
                result.expected_code_answer.push(systemResult.output);
                if (userResult.output !== systemResult.output) {
                    const error = new ExecutionError(
                        Status.WrongAnswer,
                        `Expected ${systemResult.output}, got ${userResult.output}`,
                        testCaseNumber,
                        input
                    );
                    handleError(result, error, testCaseNumber, input);
                    if (stopOnFailure) return;
                    continue;
                }
                isCorrect = true;
            } else if (expectedOutput) {
                result.expected_code_answer.push(expectedOutput);
                if (userResult.output !== expectedOutput) {
                    const error = new ExecutionError(
                        Status.WrongAnswer,
                        `Expected ${expectedOutput}, got ${userResult.output}`,
                        testCaseNumber,
                        input
                    );
                    handleError(result, error, testCaseNumber, input);
                    result.lastTestCase!.output = userResult.output;
                    result.lastTestCase!.expectedOutput = expectedOutput;
                    if (stopOnFailure) return;
                    continue;
                }
                isCorrect = true;
            }

            if (isCorrect) {
                result.correctTestCases++;
            }
        } catch (error: unknown) {
            const err =
                error instanceof ExecutionError
                    ? error
                    : new Error(String(error));
            handleError(result, err, testCaseNumber, input);
            if (stopOnFailure) return;
        }
    }

    if (result.errors?.length && result.status === Status.Success) {
        result.status = Status.Error;
        result.error = "One or more test cases failed";
    }
}

export async function processSubmission(
    submission: Submission,
    boxId: number,
    sandboxPath: string
): Promise<ExecutionResult> {
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
        isAnswer: false,
        execution_time: [],
        execution_memory: [],
        errors: [],
    };

    try {
        const {
            questionId,
            language,
            userCode,
            systemCode,
            functionName,
            dataInput,
            paramType,
            returnType,
        } = submission;

        const userHandler = languageHandlers[language]("userCode");
        const systemHandler =
            languageHandlers[SYSTEM_CODE_LANGUAGE]("systemCode");
        if (!userHandler || !systemHandler) {
            throw new ExecutionError(
                Status.Error,
                `Unsupported code language: ${language} or ${SYSTEM_CODE_LANGUAGE}`
            );
        }

        const { testcases, totalTestCases } = await validateTestCases(
            dataInput,
            paramType,
            true
        );
        result.totalTestCases = totalTestCases;

        const userWrappedCode = userHandler.wrapCode(
            userCode,
            functionName,
            paramType,
            returnType
        );
        console.log(`Compiling user code for submission ${questionId}`);
        const userCompileResult = await compileCode(
            userHandler,
            userWrappedCode,
            boxId,
            sandboxPath,
            true
        );
        console.log("User code compilation:", userCompileResult);
        if (userCompileResult.status !== Status.Success) {
            throw new ExecutionError(
                userCompileResult.status,
                userCompileResult.error ?? "User code compilation failed"
            );
        }

        const systemWrappedCode = systemHandler.wrapCode(
            systemCode,
            functionName,
            paramType,
            returnType
        );
        console.log(`Compiling system code for submission ${questionId}`);
        const systemCompileResult = await compileCode(
            systemHandler,
            systemWrappedCode,
            boxId,
            sandboxPath,
            false
        );
        console.log("System code compilation:", systemCompileResult);
        if (systemCompileResult.status !== Status.Success) {
            throw new ExecutionError(
                Status.InternalError,
                systemCompileResult.error ?? "System code compilation failed"
            );
        }

        await processTestCases(
            result,
            testcases,
            paramType,
            userHandler,
            boxId,
            sandboxPath,
            systemHandler
        );

        if (result.errors!.length > 0 && result.status === Status.Success) {
            result.status = Status.Error;
            result.error = "One or more test cases failed";
        }
    } catch (error) {
        const err =
            error instanceof ExecutionError ? error : new Error(String(error));
        handleError(result, err);
    }

    return result;
}

export async function processAnswer(
    submission: Submission,
    boxId: number,
    sandboxPath: string
): Promise<ExecutionResult> {
    const result: ExecutionResult = {
        submissionId: submission.submissionId!,
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
        isAnswer: true,
        errors: [],
    };

    try {
        const {
            questionId,
            language,
            userCode,
            systemCode,
            functionName,
            dataInput,
            paramType,
            returnType,
        } = submission;

        const userHandler = languageHandlers[language]("userCode");
        if (!userHandler) {
            throw new ExecutionError(
                Status.Error,
                `Unsupported code language: ${language}`
            );
        }

        const { testcases, totalTestCases } = await validateTestCases(
            dataInput,
            paramType,
            false
        );
        result.totalTestCases = totalTestCases;

        const expectedOutputs = systemCode
            ? systemCode.split("\n").filter((line) => line.trim())
            : [];
        if (expectedOutputs.length !== totalTestCases) {
            throw new ExecutionError(
                Status.Error,
                `Expected ${totalTestCases} outputs, got ${expectedOutputs.length}`
            );
        }

        const userWrappedCode = userHandler.wrapCode(
            userCode,
            functionName,
            paramType,
            returnType
        );
        console.log(`Compiling user code for submission ${questionId}`);
        const userCompileResult = await compileCode(
            userHandler,
            userWrappedCode,
            boxId,
            sandboxPath,
            true
        );
        console.log("User code compilation:", userCompileResult);
        if (userCompileResult.status !== Status.Success) {
            throw new ExecutionError(
                userCompileResult.status,
                userCompileResult.error ?? "User code compilation failed"
            );
        }

        await processTestCases(
            result,
            testcases,
            paramType,
            userHandler,
            boxId,
            sandboxPath,
            undefined,
            expectedOutputs,
            true
        );
    } catch (error) {
        const err =
            error instanceof ExecutionError ? error : new Error(String(error));
        handleError(result, err);
    }
    return result;
}
