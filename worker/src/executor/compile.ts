import { promises as fs } from "fs";
import path from "path";
import { LanguageHandler } from "../handlers/handler";
import {
    Status,
    MEMORY_LIMIT_KB,
    COMPILE_TIMEOUT_SECONDS,
    PROCESS_LIMIT,
    COMPILE_META_FILE,
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
            `-E`,
            `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,
            `-p`,
            `--run`,
            `--`,
            ...handler.compileCommand,
        ];

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

            if (meta.status) {
                status =
                    meta.status === "TO"
                        ? Status.Timeout
                        : meta.status === "RE"
                        ? Status.RuntimeError
                        : Status.CompilationError;
                errorMessage = meta.message || errorMessage;
            }
            return { status, error: errorMessage, meta };
        } catch {
            return { status, error: errorMessage };
        }
    }
}
