import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TestCase {
  input: string;
  output: string;
}

export interface ExecutionResult {
  submissionId: string;
  userId: string;
  questionId: string;
  status: Status;
  code_answer: string[];
  std_output_list: string[];
  expected_code_answer: string[];
  execution_time: string[];
  execution_memory: string[];
  correctTestCases: number;
  totalTestCases: number;
  lastTestCase?: LastTestCase;
  isAnswer: boolean;
  error?: string;
  errors?: string[];
}

export interface LastTestCase {
  number: number;
  input: string;
  output?: string;
  expectedOutput?: string;
  status: Status;
  error?: string;
}

type Status =
  | 'success'
  | 'error'
  | 'timeout'
  | 'runtime_error'
  | 'internal_error'
  | 'compilation_error'
  | 'wrong_answer'
  | 'memory_limit_exceeded';

interface TestcaseResultsProps {
  testCases: TestCase[];
  executionResult: ExecutionResult | null;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  loading?: boolean;
  variableNames: string[];
}

// Memoize component to prevent unnecessary re-renders
export const TestcaseResults = React.memo(
  ({
    testCases,
    executionResult,
    activeTab,
    setActiveTab,
    loading,
    variableNames,
  }: Readonly<TestcaseResultsProps>) => {

    if(loading) {
      return (
        <div className="flex flex-col gap-4 p-4 h-[calc(100%-3rem)] overflow-auto">
          <div className="flex gap-2" role="tablist">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-md bg-zinc-300" />
            ))}
          </div>

          <div className="mt-4">
            <Skeleton className="h-4 w-24 mb-2 bg-zinc-300" />
            <Skeleton className="h-10 w-full mb-4 bg-zinc-300" />

            <Skeleton className="h-4 w-24 mb-2 bg-zinc-300" />
            <Skeleton className="h-10 w-full mb-4 bg-zinc-300" />

            <Skeleton className="h-4 w-24 mb-2 bg-zinc-300" />
            <Skeleton className="h-10 w-full mb-4 bg-zinc-300" />
          </div>
        </div>
      )
    }

    if(!executionResult) {
      return (
        <div className="flex justify-center opacity-50 mt-16">
          You must run your code first
        </div>
      );
    }

    const hasError = executionResult.status !== 'success' && executionResult.status !== 'wrong_answer';

    const isTestCaseCorrect = (index: number) => {
      console.log(executionResult.code_answer[index]);
      console.log(executionResult.expected_code_answer[index])
      return executionResult.code_answer[index] === executionResult.expected_code_answer[index];
    };

    const tabButtons = useMemo(
      () =>
        testCases.map((_, index) => (
          <Button
            key={index}
            onClick={() => setActiveTab(index)}
            variant="ghost"
            size="sm"
            className={`!pl-0 !gap-0 font-light hover:bg-zinc-200 py-1 text-sm pr-5 ${
              activeTab === index
                ? 'bg-zinc-100 dark:bg-zinc-700'
                : 'dark:hover:bg-zinc-800 font-extralight'
            }`}
            aria-selected={activeTab === index}
            role="tab"
          >
            <Dot style={{ width: "27", height: "27" }} color={isTestCaseCorrect(index) ? '#22c55e' : '#ef4444'}/>
            Case {index + 1}
          </Button>
        )),
      [testCases, activeTab, setActiveTab, isTestCaseCorrect]
    );

    const inputLines = testCases[activeTab]?.input.split('\n') || [];

    return (
      <div className="flex flex-col gap-4 p-4 h-[calc(100%-3rem)] overflow-auto">
        {loading && <p className="text-sm text-gray-500">Running tests...</p>}
        {hasError && (
          <p className="text-red-500 text-sm font-medium">
            {executionResult.status
              .replace('_', ' ')
              .toUpperCase()}
            {executionResult.error && `: ${executionResult.error}`}
          </p>
        )}
        {!hasError && (
          <>
            <div className="flex items-center gap-2" role="tablist">
              {tabButtons}
            </div>
            <div className="text-sm">
              <p className="text-sm font-medium opacity-50 mb-2">
                  Input
              </p>
              {variableNames.map((varName, idx) => (
                <div key={idx} className="mb-4">
                  <div
                    className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md border border-zinc-300"
                    aria-label={`${varName} for test case ${
                      activeTab + 1
                    }`}
                  >
                    <p className="text-sm font-medium opacity-50 mb-2">
                      {varName} =
                    </p>
                    {inputLines[idx] || 'N/A'}
                  </div>
                </div>
              ))}
              <div className="mb-4">
                <p className="text-sm font-medium opacity-50 mb-2">
                  Expected Output
                </p>
                <div
                  className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md border border-zinc-300"
                  aria-label={`Expected output for test case ${
                    activeTab + 1
                  }`}
                >
                  {executionResult.expected_code_answer[activeTab] ||
                    'N/A'}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-sm font-medium opacity-50 mb-2">
                  Actual Output
                </p>
                <div
                  className="w-full text-sm py-2 px-3 bg-zinc-100 rounded-md border border-zinc-300"
                  aria-label={`Actual output for test case ${
                    activeTab + 1
                  }`}
                >
                  {executionResult.code_answer[activeTab] || 'N/A'}
                </div>
              </div>
            </div> 
          </>
        )} 
      </div>
    );
  }
);