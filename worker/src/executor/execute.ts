import { promises as fs } from "fs";
import path from "path";
import { LanguageHandler } from "../handlers/handler";
import {
    ExecutionResult,
    Status,
    TIMEOUT_SECONDS,
    MEMORY_LIMIT_KB,
    PROCESS_LIMIT,
    META_FILE,
} from "../sandbox/types";
import { ExecutionError } from "../utils/error";
import { execFileAsync } from "../utils/exec";

export async function executeCode(
    handler: LanguageHandler,
    input: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean
): Promise<{
    output: string;
    meta: Record<string, string>;
    status: Status;
    error?: string;
}> {
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
        if (isUserCode) {
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

            if (meta.status) {
                status =
                    meta.status === "TO"
                        ? Status.Timeout
                        : meta.status === "RE"
                        ? Status.RuntimeError
                        : Status.Error;
                errorMessage = meta.message || errorMessage;
            }
            return { output: "", meta, status, error: errorMessage };
        } catch {
            return { output: "", meta: {}, status, error: errorMessage };
        }
    }
}

export async function executeTestCase(
    result: ExecutionResult,
    handler: LanguageHandler,
    input: string,
    testCaseNumber: number,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean
): Promise<{ output: string; isCorrect?: boolean; error?: ExecutionError }> {
    const codeOutput = await executeCode(
        handler,
        input,
        boxId,
        sandboxPath,
        isUserCode
    );
    if (codeOutput.status !== Status.Success) {
        if (isUserCode) {
            result.code_answer.push(codeOutput.status.toUpperCase());
            result.std_output_list.push("");
            result.expected_code_answer.push("");
            result.execution_time.push(codeOutput.meta.time ?? "0");
            result.execution_memory.push(codeOutput.meta["max-rss"] ?? "0");
        }
        return {
            output: "",
            error: new ExecutionError(
                codeOutput.status,
                codeOutput.error ?? codeOutput.status,
                testCaseNumber,
                input
            ),
        };
    }

    const solution = codeOutput.output.split("{{CODE_ANSWER}}");
    if (solution.length !== 2) {
        if (isUserCode) {
            result.code_answer.push("");
            result.std_output_list.push("");
            result.expected_code_answer.push("");
            result.execution_time.push(codeOutput.meta.time ?? "0");
            result.execution_memory.push(codeOutput.meta["max-rss"] ?? "0");
        }
        return {
            output: "",
            error: new ExecutionError(
                Status.Error,
                "Invalid output format",
                testCaseNumber,
                input
            ),
        };
    }

    const output = solution[1].trim();
    if (isUserCode) {
        result.std_output_list.push(solution[0].trim());
        result.code_answer.push(output);
        result.execution_time.push(codeOutput.meta.time ?? "0");
        result.execution_memory.push(codeOutput.meta["max-rss"] ?? "0");
    }

    return { output };
}
