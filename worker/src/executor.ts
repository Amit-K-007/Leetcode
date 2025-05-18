import { getRedisClient } from "./configs/redis";
import dotenv from "dotenv";
import { execSync, execFile } from "child_process";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { promisify } from "util";

dotenv.config();

// Interfaces for queue data
interface Submission {
  questionId: string;
  lang: "CPP" | "JAVA" | "PYTHON";
  dataInput: string;
  typedCode: string;
  userId: string;
}

interface ExecutionResult {
  submissionId: string;
  userId: string;
  questionId: string;
  status: "success" | "error" | "timeout" | "runtime_error" | "internal_error" | "compilation_error";
  output?: string;
  error?: string;
  meta?: Record<string, string>;
}

// Configuration
const REDIS_CONFIG = {
    key: "local",
    url: process.env.LOCAL_REDIS_URL!,
};
const TIMEOUT_SECONDS = 5;
const MEMORY_LIMIT_KB = 256000;
const COMPILE_TIMEOUT_SECONDS = 10;
const META_FILE = "meta.txt";
const BOX_ID = parseInt(process.env.BOX_ID || "0", 10);

const execFileAsync = promisify(execFile);

// Language handler interface
interface LanguageHandler {
  sourceFile: string;
  binaryFile: string;
  compileCommand: string[] | null;
  runCommand: string[];
  wrapCode(code: string, functionName: string): string;
}

// Language handlers
const languageHandlers: Record<string, LanguageHandler> = {
  CPP: {
    sourceFile: "solution.cpp",
    binaryFile: "solution",
    compileCommand: ["g++", "-std=c++17", "-O2", "solution.cpp", "-o", "solution"],
    runCommand: ["./solution"],
    wrapCode: (code: string, functionName: string) => `
      #include <vector>
      #include <iostream>
      #include <sstream>
      ${code}
      int main() {
        std::string numsLine, targetLine;
        std::getline(std::cin, numsLine); // e.g., [2,7,11,15]
        std::getline(std::cin, targetLine); // e.g., 9
        // Parse nums
        std::vector<int> nums;
        numsLine.erase(0, 1); numsLine.pop_back(); // Remove [ and ]
        std::stringstream ss(numsLine);
        std::string num;
        while (std::getline(ss, num, ',')) {
          nums.push_back(std::stoi(num));
        }
        int target = std::stoi(targetLine);
        Solution sol;
        auto result = sol.${functionName}(nums, target);
        std::cout << "[" << result[0] << "," << result[1] << "]" << std::endl;
        return 0;
      }
    `,
  },
  JAVA: {
    sourceFile: "Solution.java",
    binaryFile: "Solution",
    compileCommand: ["javac", "Solution.java"],
    runCommand: ["java", "Solution"],
    wrapCode: (code: string, functionName: string) => `
      import java.util.*;
      ${code}
      class Main {
        public static void main(String[] args) {
          Scanner scanner = new Scanner(System.in);
          String numsLine = scanner.nextLine(); // e.g., [2,7,11,15]
          int target = Integer.parseInt(scanner.nextLine()); // e.g., 9
          // Parse nums
          numsLine = numsLine.substring(1, numsLine.length() - 1); // Remove [ and ]
          String[] numStrs = numsLine.split(",");
          int[] nums = new int[numStrs.length];
          for (int i = 0; i < numStrs.length; i++) {
            nums[i] = Integer.parseInt(numStrs[i].trim());
          }
          Solution sol = new Solution();
          int[] result = sol.${functionName}(nums, target);
          System.out.println("[" + result[0] + "," + result[1] + "]");
        }
      }
    `,
  },
  PYTHON: {
    sourceFile: "solution.py",
    binaryFile: "solution.py",
    compileCommand: null,
    runCommand: ["python3", "solution.py"],
    wrapCode: (code: string, functionName: string) => `
      ${code}
      import json
      import sys
      nums_line = input().strip() # e.g., [2,7,11,15]
      target = int(input().strip()) # e.g., 9
      nums = json.loads(nums_line) # Parse JSON-like array
      sol = Solution()
      result = sol.${functionName}(nums, target)
      print(json.dumps(result)) # Output as JSON
    `,
  },
};

// Initialize isolate sandbox
async function initSandbox(boxId: number): Promise<string> {
  try {
    const output = execSync(`isolate --box-id=${boxId} --cg --init`, {
      stdio: ["ignore", "pipe", "inherit"],
    });
    return output.toString().trim();
  } catch (error) {
    console.error(`Failed to initialize sandbox ${boxId}:`, error);
    throw new Error(`Sandbox ${boxId} initialization failed`);
  }
}

// Clean up isolate sandbox
async function cleanupSandbox(boxId: number) {
  try {
    execSync(`isolate --box-id=${boxId} --cg --cleanup`, {
      stdio: ["ignore", "ignore", "inherit"],
    });
  } catch (error) {
    console.error(`Failed to clean up sandbox ${boxId}:`, error);
  }
}

// Compile code in sandbox
async function compileCode(
    handler: LanguageHandler,
    code: string,
    boxId: number,
    sandboxPath: string
): Promise<{ status: string; error?: string; meta?: Record<string, string> }> {
    if (!handler.compileCommand) {
        return { status: "OK" }; // No compilation for Python
    }

    const codeFile = path.join(sandboxPath, "box", handler.sourceFile);
    const metaFile = path.join(sandboxPath, "box", "compile_meta.txt");

    try {
        // Write code file
        await fs.writeFile(codeFile, code);

        // Run compilation in isolate
        const isolateArgs = [
            `--box-id=${boxId}`,
            `--cg`,
            `--cg-mem=${MEMORY_LIMIT_KB}`,
            `--time=${COMPILE_TIMEOUT_SECONDS}`,
            `--wall-time=${COMPILE_TIMEOUT_SECONDS * 1.5}`,
            `--meta=${metaFile}`,
            `--run`,
            `--`,
            ...handler.compileCommand,
        ];

        await execFileAsync("isolate", isolateArgs, {
            cwd: path.join(sandboxPath, "box"),
        });

        // Read meta-file
        let meta: Record<string, string> = {};
        try {
            const metaContent = await fs.readFile(metaFile, "utf-8");
            meta = metaContent
              .split("\n")
              .filter((line) => line.includes(":"))
              .reduce((acc, line) => {
                const [key, value] = line.split(":", 2);
                acc[key] = value;
                return acc;
              }, {} as Record<string, string>);
        } catch {
            // Meta-file may not exist for successful compilation
        }

        return { status: "OK", meta };
    } catch (error: any) {
        let status = "compilation_error";
        let errorMessage = error.message || "Compilation failed";

        // Check meta-file for details
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
                status = meta.status === "TO" ? "timeout" : meta.status === "RE" ? "runtime_error" : "compilation_error";
                errorMessage = meta.message || errorMessage;
            }
            return { status, error: errorMessage, meta };
        } catch {
            return { status, error: errorMessage };
        }
    }
}

// Execute code for a single test case
async function executeCode(
    handler: LanguageHandler,
    input: string,
    boxId: number,
    sandboxPath: string
): Promise<{ output: string; meta: Record<string, string>; status: string; error?: string }> {
    const inputFile = path.join(sandboxPath, "box", "input.txt");
    const outputFile = path.join(sandboxPath, "box", "output.txt");
    const metaFile = path.join(sandboxPath, "box", META_FILE);

    try {
        // Write input to file
        await fs.writeFile(inputFile, input);

        // Run with isolate
        const isolateArgs = [
          `--box-id=${boxId}`,
          `--cg`,
          `--cg-mem=${MEMORY_LIMIT_KB}`,
          `--time=${TIMEOUT_SECONDS}`,
          `--wall-time=${TIMEOUT_SECONDS * 1.5}`,
          `--meta=${metaFile}`,
          `--stdin=input.txt`,
          `--stdout=output.txt`,
          `--run`,
          `--`,
          ...handler.runCommand,
        ];

        await execFileAsync("isolate", isolateArgs, {
          cwd: path.join(sandboxPath, "box"),
        });

        // Read output and meta-file
        const output = await fs.readFile(outputFile, "utf-8");
        const metaContent = await fs.readFile(metaFile, "utf-8");
        const meta = metaContent
          .split("\n")
          .filter((line) => line.includes(":"))
          .reduce((acc, line) => {
            const [key, value] = line.split(":", 2);
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);

        return { output, meta, status: meta.status || "OK" };
    } catch (error: any) {
        let status = "error";
        let errorMessage = error.message || "Unknown error";

        // Check meta-file for details
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
                status = meta.status === "TO" ? "timeout" : meta.status === "RE" ? "runtime_error" : "error";
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
        status: "success",
    };

    try {
        const handler = languageHandlers[submission.lang];
        if (!handler) {
          throw new Error(`Unsupported language: ${submission.lang}`);
        }

        // Assume twoSum function; customize per questionId if needed
        const functionName = "twoSum";
        const wrappedCode = handler.wrapCode(submission.typedCode, functionName);

        // Compile code once
        const compileResult = await compileCode(handler, wrappedCode, boxId, sandboxPath);
        if (compileResult.status !== "OK") {
            result.status = compileResult.status as ExecutionResult["status"];
            result.error = compileResult.error;
            result.meta = compileResult.meta;
            return result;
        }

        // Split inputs into test cases (one per line for now)
        const testCases = submission.dataInput.split("\n").filter((line) => line.trim());

        let output = "";
        for (const testCase of testCases) {
            const { output: caseOutput, meta, status, error } = await executeCode(
                handler,
                testCase,
                boxId,
                sandboxPath
            );

            if (status !== "OK") {
                result.status = status as ExecutionResult["status"];
                result.error = error || `Execution failed with status ${status}`;
                result.meta = meta;
                break;
            }

            output += `${caseOutput}\n`;
            result.meta = meta; // Store last meta for success case
        }

        if (result.status === "success") {
            result.output = output.trim();
        }
      } catch (error) {
          result.status = "error";
          result.error = error instanceof Error ? error.message : "Unknown error";
      }

    return result;
}

async function startContainer() {
    console.log(`Container started with box-id=${BOX_ID}...`);
    let sandboxPath: string | undefined;

    try {
        // Initialize sandbox
        sandboxPath = await initSandbox(BOX_ID);
        console.log(`Sandbox initialized at ${sandboxPath}`);

        const redisClient = await getRedisClient(REDIS_CONFIG);
        while (true) {
            try {
              // Pull from local submission queue
              const submission = await redisClient.brPop("LOCAL_SUBMISSION_QUEUE", 0);
              if (!submission || !submission.element) {
                  console.log(`No submission received (box-id=${BOX_ID})`);
                  continue;
              }

              // Parse submission
              let parsedSubmission: Submission;
              try {
                  parsedSubmission = JSON.parse(submission.element) as Submission;
              } catch (error) {
                  console.error(`Invalid submission format (box-id=${BOX_ID}):`, submission.element);
                  continue;
              }

              console.log(`Processing submission ${parsedSubmission.questionId} in box-id=${BOX_ID}`);

              // Process submission
              const result = await processSubmission(parsedSubmission, BOX_ID, sandboxPath);

              // Push result to local result queue
              await redisClient.lPush("LOCAL_RESULT_QUEUE", JSON.stringify(result));
              console.log(`Result pushed for submission ${result.submissionId} (box-id=${BOX_ID})`);
            } catch (error) {
                console.error(`Processing error (box-id=${BOX_ID}):`, error);
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Retry after delay
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