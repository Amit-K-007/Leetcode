import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TestCase {
  input: string;
  output: string;
}

interface TestcaseCardProps {
  testCases: TestCase[];
  setTestCases: (testCases: TestCase[]) => void;
  variableNames: string[];
}

export function TestcaseCard({
  testCases,
  setTestCases,
  variableNames,
}: Readonly<TestcaseCardProps>) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setActiveTab(0);
  }, [testCases]);

  const updateTestCases = (newCases: TestCase[]) => {
    setTestCases(newCases);
  };

  const addTestCase = () => {
    const emptyInput = variableNames.map(() => "").join("\n");
    updateTestCases([...testCases, { input: emptyInput, output: "" }]);
    setActiveTab(testCases.length);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    const newCases = testCases.filter((_, i) => i !== index);
    updateTestCases(newCases);
    setActiveTab(Math.min(activeTab, newCases.length - 1));
  };

  const handleInputChange = (lineIndex: number, value: string) => {
    const currentLines = testCases[activeTab].input.split("\n");
    currentLines[lineIndex] = value;
    const newInput = currentLines.join("\n");
    const updatedCases = [...testCases];
    updatedCases[activeTab].input = newInput;
    updateTestCases(updatedCases);
  };

  const inputLines = testCases[activeTab]?.input?.split("\n") || [];

  return (
    <div className="flex flex-col gap-4 p-4 h-[calc(100%-3rem)] overflow-auto">
      <div className="flex items-center gap-2">
        {testCases.map((_, index) => (
          <div key={index} className="relative group">
            <Button
              onClick={() => setActiveTab(index)}
              variant="ghost"
              size="sm"
              className={`font-light hover:bg-zinc-200 px-3 py-1 text-sm pr-5 ${
                activeTab === index
                  ? "bg-zinc-100 dark:bg-zinc-700"
                  : "dark:hover:bg-zinc-800 font-extralight"
              }`}
            >
              Case {index + 1}
            </Button>
            {testCases.length > 1 && (
              <button
                onClick={() => removeTestCase(index)}
                className="absolute -top-1 -right-1 bg-white dark:bg-zinc-900 border border-zinc-300 rounded-full p-[1px] text-zinc-500 hover:text-zinc-700 hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
        {testCases.length < 8 && (
          <Button
            onClick={addTestCase}
            variant={null}
            size="icon"
            className="text-2xl font-extralight hover:font-light"
          >
            +
          </Button>
        )}
      </div>
      <div>
        {variableNames.map((varName, idx) => (
          <div key={idx} className="mb-4">
            <p className="text-sm font-medium opacity-50 mb-2">{varName} =</p>
            <input
              type="text"
              value={inputLines[idx] || ""}
              onChange={(e) => handleInputChange(idx, e.target.value)}
              className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              placeholder={`Enter value for ${varName}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
