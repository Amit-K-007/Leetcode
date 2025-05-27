import { LanguageHandler } from "./handler";

export function createJavaHandler(filename: string): LanguageHandler {
    return {
        sourceFile: `${filename}.java`,
        binaryFile: filename,
        compileCommand: [
            "/usr/local/bin/javac",
            `${filename}.java`
        ],
        runCommand: ["/usr/local/bin/java", "-cp", ".", filename],
        wrapCode: (code: string, functionName: string, paramTypes: string[], returnType: string): string => {
            let inputCode = "";
            const variables: string[] = [];

            inputCode += "Scanner scanner = new Scanner(System.in);\n";
            paramTypes.forEach((type, i) => {
                switch (type) {
                    case "integer[]":
                        inputCode += `
                            String line${i} = scanner.nextLine();
                            String[] parts${i} = line${i}.split(" ");
                            int[] param${i} = new int[parts${i}.length];
                            for (int j = 0; j < parts${i}.length; j++) {
                                param${i}[j] = Integer.parseInt(parts${i}[j]);
                            }
                        `;
                        break;
                    case "integer":
                        inputCode += `
                            int param${i} = scanner.nextInt();
                        `;
                        break;
                    case "string":
                        inputCode += `
                            String param${i} = scanner.next();
                        `;
                        break;
                    case "string[]":
                        inputCode += `
                            String line${i} = scanner.nextLine();
                            String[] param${i} = line${i}.split(" ");
                        `;
                        break;
                    case "character":
                        inputCode += `
                            char param${i} = scanner.next().charAt(0);
                        `;
                        break;
                    case "character[]":
                        inputCode += `
                            String line${i} = scanner.nextLine();
                            char[] param${i} = line${i}.replaceAll("\\s+", "").toCharArray();
                        `;
                        break;
                    default:
                        throw new Error(`Unsupported type: ${type}`);
                }
                variables.push(`param${i}`);
            });

            let outputCode = 'System.out.print("{{CODE_ANSWER}}");';
            let resultType = "";
            if (returnType === "integer[]") {
                resultType = "int[]";
                outputCode += `
                    System.out.print("[");
                    for (int i = 0; i < result.length; i++) {
                        System.out.print(result[i]);
                        if (i < result.length - 1) System.out.print(",");
                    }
                    System.out.print("]");
                `;
            } else if (returnType === "string[]") {
                resultType = "String[]";
                outputCode += `
                    System.out.print("[");
                    for (int i = 0; i < result.length; i++) {
                        System.out.print(result[i]);
                        if (i < result.length - 1) System.out.print(",");
                    }
                    System.out.print("]");
                `;
            } else if (returnType === "character[]") {
                resultType = "char[]";
                outputCode += `
                    System.out.print("[");
                    for (int i = 0; i < result.length; i++) {
                        System.out.print("'" + result[i] + "'");
                        if (i < result.length - 1) System.out.print(",");
                    }
                    System.out.print("]");
                `;
            } else if (returnType === "integer") {
                resultType = "int";
                outputCode += `System.out.print(result);`;
            } else if (returnType === "string") {
                resultType = "String";
                outputCode += `System.out.print(result);`;
            } else if (returnType === "character") {
                resultType = "char";
                outputCode += `System.out.print("'" + result + "'");`;
            } else {
                throw new Error(`Unsupported return type: ${returnType}`);
            }

            return `
                import java.util.*;
                ${code}
                public class ${filename} {
                    public static void main(String[] args) {
                        ${inputCode}
                        Solution sol = new Solution();
                        ${resultType} result = sol.${functionName}(${variables.join(", ")});
                        ${outputCode}
                    }
                }
            `;
        },
    };
}
