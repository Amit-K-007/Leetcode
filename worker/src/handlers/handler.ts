import { createCppHandler } from "./cppHandler";
import { createJavaHandler } from "./javaHandler";
import { createPythonHandler } from "./pythonHandler";

export interface LanguageHandler {
    sourceFile: string;
    binaryFile: string | null;
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
    JAVA: createJavaHandler,
    PYTHON: createPythonHandler,
};
