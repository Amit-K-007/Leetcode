import { createCppHandler } from "./cppHandler";

export interface LanguageHandler {
    sourceFile: string;
    binaryFile: string;
    compileCommand: string[] | null;
    runCommand: string[];
    wrapCode(
        code: string,
        functionName: string,
        paramTypes: string[],
        returnType: string
    ): string;
}

export const languageHandlers: Record<string, (filename: string) => LanguageHandler> = {
    CPP: createCppHandler,
};
