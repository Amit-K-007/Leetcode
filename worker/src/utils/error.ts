import { ExecutionResult, Status } from "../sandbox/types";

export class ExecutionError extends Error {
    constructor(
        public status: Status,
        message: string,
        public testCaseNumber: number = 0,
        public input: string = ""
    ) {
        super(message);
        this.name = "ExecutionError";
    }
}

export function handleError(
    result: ExecutionResult,
    error: ExecutionError | Error,
    testCaseNumber: number = 0,
    input: string = ""
): ExecutionResult {
    const status = error instanceof ExecutionError ? error.status : Status.Error;
    const message = error.message || "Unknown error";
    result.status = status;
    result.error = message;
    result.errors = result.errors || [];
    if (testCaseNumber > 0) {
        result.errors.push(`Test case ${testCaseNumber}: ${message}`);
        result.lastTestCase = {
            number: testCaseNumber,
            input,
            status,
            error: message,
        };
    }
    return result;
}
