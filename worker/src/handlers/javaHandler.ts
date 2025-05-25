import { LanguageHandler } from "./handler";

// export const javaHandler: LanguageHandler = {
//     sourceFile: "Solution.java",
//     binaryFile: "Solution",
//     compileCommand: ["javac", "Solution.java"],
//     runCommand: ["java", "Solution"],
//     wrapCode: (code: string, functionName: string, paramTypes: string[], returnType: string) => {
//         return `
//             import java.util.*;
//             ${code}
//             class Main {
//                 public static void main(String[] args) {
//                 Scanner scanner = new Scanner(System.in);
//                 String numsLine = scanner.nextLine(); // e.g., [2,7,11,15]
//                 int target = Integer.parseInt(scanner.nextLine()); // e.g., 9
//                 // Parse nums
//                 numsLine = numsLine.substring(1, numsLine.length() - 1); // Remove [ and ]
//                 String[] numStrs = numsLine.split(",");
//                 int[] nums = new int[numStrs.length];
//                 for (int i = 0; i < numStrs.length; i++) {
//                     nums[i] = Integer.parseInt(numStrs[i].trim());
//                 }
//                 Solution sol = new Solution();
//                 int[] result = sol.${functionName}(nums, target);
//                 System.out.println("[" + result[0] + "," + result[1] + "]");
//                 }
//             }
//         `;
//     },
// };
