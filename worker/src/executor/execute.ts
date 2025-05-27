import { promises as fs } from "fs";
import path from "path";
import { LanguageHandler } from "../handlers/handler";
import {
    ExecutionResult,
    Status,
    TIMEOUT_SECONDS,
    EXECUTE_MEMORY_LIMIT_KB,
    EXECUTE_PROCESS_LIMIT,
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
    const stderrFile = path.join(sandboxPath, "box", "stderr.txt");

    try {
        await fs.writeFile(inputFile, input);

        const isolateArgs = [
            `--box-id=${boxId}`,
            `--processes=${EXECUTE_PROCESS_LIMIT}`,
            `--cg`,
            `--cg-mem=${EXECUTE_MEMORY_LIMIT_KB}`,
            `--time=${TIMEOUT_SECONDS}`,
            `--wall-time=${TIMEOUT_SECONDS * 1.5}`,
            `--fsize=1024`,
            ...(isUserCode ? [`--meta=${metaFile}`] : []),
            `-E`, `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
            `--stderr=stderr.txt`,
            `--stdin=input.txt`,
            `--stdout=output.txt`,
            `--run`,
            `--`,
            ...handler.runCommand,
        ];
        // console.log(isolateArgs);
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

            let stderr = "";
            try {
                stderr = await fs.readFile(stderrFile, "utf-8");
                if (stderr) errorMessage = stderr.trim();
            } catch {}
            if (meta.status) {
                if (meta.status === "TO") {
                    status = Status.Timeout;
                    errorMessage = "Time limit exceeded";
                } else if (meta.status === "RE" || meta.status === "SG" || meta.status === "XX") {
                    if (
                        meta["cg-oom-killed"] === "1" ||
                        parseInt(meta["max-rss"] || "0") >= EXECUTE_MEMORY_LIMIT_KB ||
                        meta.exitsig === "9"
                    ) {
                        status = Status.MemoryLimitExceeded;
                        errorMessage = "Memory limit exceeded";
                    } else {
                        status = Status.RuntimeError;
                        errorMessage = stderr || meta.message || "Runtime error";
                    }
                } else {
                    status = Status.Error;
                    errorMessage = meta.message || errorMessage;
                }
            }
            meta["stderr"] = stderr;
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
