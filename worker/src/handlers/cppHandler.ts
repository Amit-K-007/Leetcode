import { LanguageHandler } from "./handler";

export function createCppHandler(filename: string): LanguageHandler {
    return {
        sourceFile: `${filename}.cpp`,
        binaryFile: filename,
        compileCommand: [
            "/usr/bin/g++",
            "-std=c++17",
            "-O2",
            `${filename}.cpp`,
            "-o",
            filename,
        ],
        runCommand: [`./${filename}`],
        wrapCode: (code: string, functionName: string, paramTypes: string[], returnType: string): string => {
            let inputCode = "";
            const variables: string[] = [];

            paramTypes.forEach((type, i) => {
                switch (type) {
                    case "integer[]":
                        inputCode += `
                            vector<int> param${i};
                            string line${i};
                            getline(cin, line${i});
                            istringstream iss${i}(line${i});
                            int x${i};
                            while (iss${i} >> x${i}) param${i}.push_back(x${i});
                        `;
                        break;
                    case "integer":
                        inputCode += `
                            int param${i};
                            cin >> param${i};
                        `;
                        break;
                    case "string":
                        inputCode += `
                            string param${i};
                            cin >> param${i};
                        `;
                        break;
                    case "string[]":
                        inputCode += `
                            vector<string> param${i};
                            string line${i};
                            getline(cin, line${i});
                            istringstream iss${i}(line${i});
                            string s${i};
                            while (iss${i} >> s${i}) param${i}.push_back(s${i});
                        `;
                        break;
                    case "character":
                        inputCode += `
                            char param${i};
                            cin >> param${i};
                        `;
                        break;
                    case "character[]":
                        inputCode += `
                            vector<char> param${i};
                            string line${i};
                            getline(cin, line${i});
                            istringstream iss${i}(line${i});
                            char c${i};
                            while (iss${i} >> c${i}) param${i}.push_back(c${i});
                        `;
                        break;
                    default:
                        throw new Error(`Unsupported type: ${type}`);
                }
                variables.push(`param${i}`);
            });

            let outputCode = 'cout << "-->";';
            if (returnType.endsWith("[]")) {
                outputCode += `
                    cout << "[";
                    bool first = true;
                    for (auto i : result) {
                        if (!first) cout << ",";
                        cout << i;
                        first = false;
                        }
                    cout << "]";
                `;
            } else {
                outputCode += `cout << result;`;
            }

            return `
                #include <iostream>
                #include <bits/stdc++.h>
                using namespace std;
                ${code}
                int main() {
                    ${inputCode}
                    Solution sol;
                    auto result = sol.${functionName}(${variables.join(", ")});
                    ${outputCode}   
                    return 0;
                }
            `;
        },
    };
}
