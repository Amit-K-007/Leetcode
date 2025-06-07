import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TestcaseCard() {
  const initialTestCases = [
    { nums: [2, 7, 11, 15], target: 9 },
    { nums: [3, 2, 4], target: 6 },
    { nums: [3, 3], target: 6 },
  ];

  const [testCases, setTestCases] = useState(initialTestCases);
  const [activeTab, setActiveTab] = useState(0);

  const addTestCase = () => {
    setTestCases([...testCases, { nums: [], target: 0 }]);
    setActiveTab(testCases.length);
  };

  const removeTestCase = (index: number) => {
    if (testCases.length <= 1) return;
    const newTestCases = testCases.filter((_, i) => i !== index);
    setTestCases(newTestCases);
    setActiveTab(Math.min(activeTab, newTestCases.length - 1));
  };

  // Handle nums input change
  const handleNumsChange = (value: string) => {
    const newTestCases = [...testCases];
    // Parse the input string into an array of numbers
    const nums = value
      .split(",")
      .map((num) => parseInt(num.trim()))
      .filter((num) => !isNaN(num)); // Filter out invalid numbers
    newTestCases[activeTab].nums = nums;
    setTestCases(newTestCases);
  };

  // Handle target input change
  const handleTargetChange = (value: string) => {
    const newTestCases = [...testCases];
    const target = parseInt(value);
    newTestCases[activeTab].target = isNaN(target) ? 0 : target; // Default to 0 if invalid
    setTestCases(newTestCases);
  };

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

      <div >
        <p className="text-sm font-medium opacity-50 mb-2">nums =</p>
        <input
          type="text"
          value={testCases[activeTab].nums.join(",")}
          onChange={(e) => handleNumsChange(e.target.value)}
          className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md mb-4 border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          placeholder="Enter numbers (e.g., 2,7,11,15)"
        />
        <p className="text-sm font-medium opacity-50 mb-2">target =</p>
        <input
          type="text"
          value={testCases[activeTab].target}
          onChange={(e) => handleTargetChange(e.target.value)}
          className="w-full text-sm px-3 py-2 bg-zinc-100 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          placeholder="Enter target (e.g., 9)"
        />
      </div>
    </div>
  );
}