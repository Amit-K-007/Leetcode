import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/debounce';

interface TestCase {
  input: string; // e.g., "[3,3]\n6"
  output: string; // e.g., "[0,1]"
}

interface TestcaseCardProps {
  testCases: TestCase[];
  setTestCases: (testCases: TestCase[]) => void;
  variableNames: string[]; // e.g., ["nums", "target"]
  loading?: boolean; // For submission feedback
  error?: string | null; // For error display
  results?: TestResult[]; // For test case results
}

interface TestResult {
  testCaseId: number;
  passed: boolean;
  output: string;
  error?: string;
}

// Memoize component to prevent unnecessary re-renders
export const TestcaseCard = React.memo(
  ({
    testCases,
    setTestCases,
    variableNames,
    loading,
    error,
    results,
  }: Readonly<TestcaseCardProps>) => {
    const [activeTab, setActiveTab] = useState(0);
    // Local state for editing inputs to reduce parent updates
    const [localInputs, setLocalInputs] = useState<string[]>(
      initializeInputs(testCases[0]?.input, variableNames.length)
    );

    // Initialize inputs to match variableNames length
    function initializeInputs(input: string | undefined, length: number): string[] {
      if (!input) return Array(length).fill('');
      const lines = input.split('\n');
      return Array.from({ length }, (_, i) => lines[i] || '');
    }

    // Sync activeTab and localInputs when testCases change
    useEffect(() => {
      setActiveTab(0); // Reset to first tab
      setLocalInputs(initializeInputs(testCases[0]?.input, variableNames.length));
    }, []);

    // Sync localInputs when activeTab changes
    useEffect(() => {
      setLocalInputs(initializeInputs(testCases[activeTab]?.input, variableNames.length));
    }, [activeTab, testCases]);

    // Debounced update to parent
    const debouncedUpdateTestCases = useMemo(
      () =>
        debounce((newCases: TestCase[]) => {
          setTestCases(newCases);
        }, 300),
      [setTestCases]
    );

    // Update test cases
    const updateTestCases = useCallback(
      (newCases: TestCase[]) => {
        debouncedUpdateTestCases(newCases);
      },
      [debouncedUpdateTestCases]
    );

    // Add a new test case
    const addTestCase = useCallback(() => {
      const emptyInput = variableNames.map(() => '').join('\n'); // e.g., "\n" for ["nums", "target"]
      const newCases = [...testCases, { input: emptyInput, output: '' }];
      updateTestCases(newCases);
      setActiveTab(newCases.length - 1);
    }, [testCases, updateTestCases, variableNames]);

    // Remove a test case
    const removeTestCase = useCallback(
      (index: number) => {
        if (testCases.length <= 1) return;
        const newCases = testCases.filter((_, i) => i !== index);
        updateTestCases(newCases);
        setActiveTab(Math.min(activeTab, newCases.length - 1));
      },
      [testCases, updateTestCases, activeTab]
    );

    // Handle input change
    const handleInputChange = useCallback(
      (lineIndex: number, value: string) => {
        setLocalInputs((prev) => {
          const newInputs = [...prev];
          newInputs[lineIndex] = value;
          const newInput = newInputs.join('\n'); // e.g., "[3,3]\n6"
          const updatedCases = [...testCases];
          updatedCases[activeTab] = { ...updatedCases[activeTab], input: newInput };
          updateTestCases(updatedCases);
          return newInputs;
        });
      },
      [activeTab, testCases, updateTestCases]
    );

    // Memoize input lines
    const inputLines = useMemo(() => localInputs, [localInputs]);

    // Memoize tab rendering
    const tabButtons = useMemo(
      () =>
        testCases.map((_, index) => (
          <div key={index} className="relative group">
            <Button
              onClick={() => setActiveTab(index)}
              variant="ghost"
              size="sm"
              className={`font-light hover:bg-zinc-200 px-3 py-1 text-sm pr-5 ${
                activeTab === index
                  ? 'bg-zinc-100 dark:bg-zinc-700'
                  : 'dark:hover:bg-zinc-800 font-extralight'
              }`}
              aria-selected={activeTab === index}
              role="tab"
            >
              Case {index + 1}
            </Button>
            {testCases.length > 1 && (
              <button
                onClick={() => removeTestCase(index)}
                className="absolute -top-1 -right-1 bg-white dark:bg-zinc-900 border border-zinc-300 rounded-full p-[1px] text-zinc-500 hover:text-zinc-700 hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Remove test case ${index + 1}`}
              >
                <X size={10} />
              </button>
            )}
          </div>
        )),
      [testCases, activeTab, removeTestCase]
    );

    return (
      <div className="flex flex-col gap-4 p-4 h-[calc(100%-3rem)] overflow-auto">
        {/* Display error or loading state */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {loading && <p className="text-sm text-gray-500">Submitting...</p>}
        {/* Tabs */}
        <div className="flex items-center gap-2" role="tablist">
          {tabButtons}
          {testCases.length < 8 && (
            <Button
              onClick={addTestCase}
              variant={null}
              size="icon"
              className="text-2xl font-extralight hover:font-light"
              aria-label="Add new test case"
            >
              +
            </Button>
          )}
        </div>
        {/* Inputs */}
        <div>
          {variableNames.map((varName, idx) => (
            <div key={idx} className="mb-4">
              <p className="text-sm font-medium opacity-50 mb-2">{varName} =</p>
              <input
                type="text"
                value={inputLines[idx] || ''}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                placeholder={`Enter value for ${varName}`}
                disabled={loading}
                aria-label={`${varName} input for test case ${activeTab + 1}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }
);