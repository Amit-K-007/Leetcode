import { LanguageHandler } from "./handler";

// export const pythonHandler: LanguageHandler = {
//     sourceFile: "solution.py",
//     binaryFile: "solution.py",
//     compileCommand: null,
//     runCommand: ["python3", "solution.py"],
//     wrapCode: (code: string, functionName: string, paramTypes: string[], returnType: string) => {
//         return `
//             ${code}
//             import json
//             import sys
//             nums_line = input().strip() # e.g., [2,7,11,15]
//             target = int(input().strip()) # e.g., 9
//             nums = json.loads(nums_line) # Parse JSON-like array
//             sol = Solution()
//             result = sol.${functionName}(nums, target)
//             print(json.dumps(result)) # Output as JSON
//         `;
//     },
// };
