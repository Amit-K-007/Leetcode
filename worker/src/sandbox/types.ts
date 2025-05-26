export enum Status {
    Success = "success",
    Error = "error",
    Timeout = "timeout",
    RuntimeError = "runtime_error",
    InternalError = "internal_error",
    CompilationError = "compilation_error",
    WrongAnswer = "wrong_answer",
}

export interface Submission {
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

export interface LastTestCase {
    number: number;
    input: string;
    output?: string;
    expectedOutput?: string;
    status: Status;
    error?: string;
}

export interface ExecutionResult {
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

export const REDIS_CONFIG = {
    key: "local",
    url: process.env.LOCAL_REDIS_URL!,
};

export const TIMEOUT_SECONDS = 3;
export const MEMORY_LIMIT_KB = 256000;
export const COMPILE_TIMEOUT_SECONDS = 5;
export const PROCESS_LIMIT = 1;
export const META_FILE = "meta.txt";
export const COMPILE_META_FILE = "compile_meta.txt";
export const BOX_ID = parseInt(process.env.BOX_ID ?? "0", 10);
export const SYSTEM_CODE_LANGUAGE = "CPP";
