import { LanguageHandler } from "./handler";

export function createPythonHandler(filename: string): LanguageHandler {
    return {
        sourceFile: `${filename}.py`,
        binaryFile: null,
        compileCommand: null,
        runCommand: ["/usr/bin/python3", `${filename}.py`],
        wrapCode: (
            code: string,
            functionName: string,
            paramTypes: string[],
            returnType: string
        ): string => {
            let inputCode = "";
            const variables: string[] = [];

            paramTypes.forEach((type, i) => {
                switch (type) {
                    case "integer[]":
                        inputCode += `param${i} = list(map(int, input().strip().split()))\n`;
                        break;
                    case "integer":
                        inputCode += `param${i} = int(input())\n`;
                        break;
                    case "string":
                        inputCode += `param${i} = input().strip()\n`;
                        break;
                    case "string[]":
                        inputCode += `param${i} = input().strip().split()\n`;
                        break;
                    case "character":
                        inputCode += `param${i} = input().strip()[0]\n`;
                        break;
                    case "character[]":
                        inputCode += `param${i} = list(input().strip().replace(" ", ""))\n`;
                        break;
                    default:
                        throw new Error(`Unsupported type: ${type}`);
                }
                variables.push(`param${i}`);
            });

            let outputCode = `print("{{CODE_ANSWER}}", end="")\n`;
            switch (returnType) {
                case "integer[]":
                    outputCode += `print(f"[{result[0]},{result[1]}]")\n`;
                    break;
                case "string[]":
                    outputCode += `print(f"[{','.join(result)}]")\n`;
                    break;
                case "character[]":
                    outputCode += `print(f"[{','.join(f'\\'{c}\\'' for c in result)}]")\n`;
                    break;
                case "integer":
                case "string":
                    outputCode += `print(result)\n`;
                    break;
                case "character":
                    outputCode += `print(f"'{result}'")\n`;
                    break;
                default:
                    throw new Error(`Unsupported return type: ${returnType}`);
            }

            return `${code.trim()}

if __name__ == "__main__":
${inputCode
    .split("\n")
    .map(line => line.trim() ? "    " + line.trim() : "")
    .join("\n")}
    sol = Solution()
    result = sol.${functionName}(${variables.join(", ")})
${outputCode
    .split("\n")
    .map(line => line.trim() ? "    " + line.trim() : "")
    .join("\n")}
`;
        },
    };
}
