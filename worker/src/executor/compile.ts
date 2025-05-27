import { promises as fs } from "fs";
import path from "path";
import { LanguageHandler } from "../handlers/handler";
import {
    Status,
    COMPILE_TIMEOUT_SECONDS,
    COMPILE_PROCESS_LIMIT,
    COMPILE_META_FILE,
    COMPILE_MEMORY_LIMIT_KB,
} from "../sandbox/types";
import { execFileAsync } from "../utils/exec";

export async function compileCode(
    handler: LanguageHandler,
    code: string,
    boxId: number,
    sandboxPath: string,
    isUserCode: boolean
): Promise<{ status: Status; error?: string; meta?: Record<string, string> }> {
    if (!handler.compileCommand) {
        return { status: Status.Success };
    }

    const sourceFile = path.join(sandboxPath, "box", handler.sourceFile);
    const metaFile = path.join(sandboxPath, "box", COMPILE_META_FILE);
    const stderrFile = path.join(sandboxPath, "box", "stderr.txt");

    try {
        await fs.writeFile(sourceFile, code);

        const isolateArgs = [
            `--box-id=${boxId}`,
            `--processes=${COMPILE_PROCESS_LIMIT}`,
            `--cg`,
            `--cg-mem=${COMPILE_MEMORY_LIMIT_KB}`,
            `--time=${COMPILE_TIMEOUT_SECONDS}`,
            `--wall-time=${COMPILE_TIMEOUT_SECONDS * 1.5}`,
            `--fsize=1024`,
            ...(isUserCode ? [`--meta=${metaFile}`] : []),
            `--stderr=stderr.txt`,
            `-E`, `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
            `--run`,
            `--`,
            ...handler.compileCommand,
        ];
        // console.log(isolateArgs);
        await execFileAsync("isolate", isolateArgs, {
            cwd: path.join(sandboxPath, "box"),
        });

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

            let stderr = "";
            try {
                stderr = await fs.readFile(stderrFile, "utf-8");
                if (stderr) errorMessage = stderr.trim();
            } catch {}

            if (meta.status) {
                if (meta.status === "TO") {
                    status = Status.Timeout;
                    errorMessage = "Compilation time limit exceeded";
                } else if (meta.status === "RE" || meta.status === "SG" || meta.status === "XX") {
                    if (
                        meta["cg-oom-killed"] === "1" ||
                        parseInt(meta["max-rss"] || "0") >= COMPILE_MEMORY_LIMIT_KB ||
                        meta.exitsig === "9"
                    ) {
                        status = Status.MemoryLimitExceeded;
                        errorMessage = "Compilation memory limit exceeded";
                    } else {
                        status = Status.CompilationError;
                        errorMessage = stderr || meta.message || "Compilation failed";
                    }
                }
            }
            meta["stderr"] = stderr;
            return { status, error: errorMessage, meta };
        } catch {
            return { status, error: errorMessage };
        }
    }
}
