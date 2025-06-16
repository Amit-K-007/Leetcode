import { CodeEditor } from "@/components/problem/CodeEditor";
import { LangSelector } from "@/components/problem/LangSelector";
import { ProblemNavbar } from "@/components/problem/ProblemNavbar";
import { TestcaseCard } from "@/components/problem/TestcaseCard";
import { TestcaseNavbar } from "@/components/problem/TestcaseNavbar";
import { TestcaseResults } from "@/components/problem/TestcaseResults";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import axios from "axios";
import { BookText, CircleFadingArrowUp, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import Split from 'react-split'

interface TestCase {
  input: string;
  output: string;
}

interface CodeSnippets {
  language: string;
  code: string;
}

interface ProblemData {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  functionName: string;
  testCases: TestCase[];
  codeSnippets: CodeSnippets[];
  paramName: string[];
}

interface ProblemInfo {
  id: number | null;
  title: string | null;
  description: string | null;
  functionName: string | null;
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

type Language = "CPP" | "PYTHON" | "JAVA";

const API_URL = import.meta.env.VITE_API_URL;

export function Problem() {
  const { slug } = useParams<{ slug: string }>();
  const { token } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [problemInfo, setProblemInfo] = useState<ProblemInfo>({ id: null, title: null, description: null, functionName: null });
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippets[]>([]);
  const [initialCodeSnippets, setInitialCodeSnippets] = useState<CodeSnippets[]>([]);
  const [language, setLanguage] = useState<Language>("CPP");
  const [paramName, setParamName] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [testcaseView, setTestcaseView] = useState<'testcase' | 'results'>('testcase');
  const [activeTab, setActiveTab] = useState(0);
  const [runningCode, setRunningCode] = useState(false);
  const [submittingAnswer, setSubmittingAnswer] = useState(false); 

  useEffect(() => {
    const fetchProblemData = async () => {
      setLoading(true);
      try {
        const res = await axios.get<{ data: ProblemData }>(`${API_URL}/problems/${slug}`);
        const problemData = res.data.data;

        setProblemInfo({
          id: problemData.id,
          title: problemData.title,
          description: problemData.description,
          functionName: problemData.functionName,
        });
        setTestCases(problemData.testCases);
        setCodeSnippets(problemData.codeSnippets);
        setInitialCodeSnippets(problemData.codeSnippets);
        setParamName(problemData.paramName);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProblemData();
  }, [slug]);

  useEffect(() => {
    if(!socket) return;

    const handleResult = (data: string) => {
      setSubmittingAnswer(false);
      setRunningCode(false);
      const result = JSON.parse(data) as ExecutionResult;
      console.log(result);
      if(result.isAnswer) {
        navigate(`/problems/${slug}/submissions/${result.submissionId}`);
      } else {
        setExecutionResult(result);
        setTestcaseView('results');
        if (
          result.lastTestCase &&
          !['success', 'wrong_answer'].includes(result.status)
        ) {
          setActiveTab(result.lastTestCase.number);
        }
      }
    };

    socket.on("result", handleResult);

    return () => {
      socket.off("result", handleResult);
    };
  }, [navigate, slug, socket]);

  const handleSubmission = async () => {
    setRunningCode(true);
    setTestcaseView('results');
    setError(null);
    try {
      const userCode = codeSnippets.find((s) => s.language === language)?.code;
      if (!userCode || !problemInfo.id) {
        setError('Invalid code or problem ID');
        return;
      }
      await axios.post(`${API_URL}/problems/${slug}/interpret_solution`, {
        questionId: problemInfo.id.toString(),
        language: language,
        dataInput: testCases.map((tc) => tc.input.trim()).join('\n'),
        userCode,
      }, {
        headers: {
          Authorization: token,
        }
      });
    } catch (error) {
      setError('Submission failed. Please try again.');
      console.log(error);
      setRunningCode(false);
    }
  };

  const handleAnswer = async () => {
    setSubmittingAnswer(true);
    setError(null);
    try {
      const userCode = codeSnippets.find((s) => s.language === language)?.code;
      if (!userCode || !problemInfo.id) {
        setError('Invalid code or problem ID');
        return;
      }
      await axios.post(`${API_URL}/problems/${slug}/submit`, {
        questionId: problemInfo.id.toString(),
        language: language,
        userCode,
      }, {
        headers: {
          Authorization: token,
        }
      });
    } catch (error) {
      setError('Submission failed. Please try again.');
      console.log(error);
      setSubmittingAnswer(false);
    }
  };

  const handleResetCode = () => {
    setCodeSnippets(initialCodeSnippets);
  };

  return (
    <div className="h-screen w-screen bg-zinc-100 flex flex-col">
      <ProblemNavbar 
        handleSubmission={handleSubmission} 
        handleAnswer={handleAnswer} 
        runningCode={runningCode} 
        submittingAnswer={submittingAnswer}  
      />
      <Split
        className="flex flex-1 pb-4 h-[calc(100%-3rem)]"
        sizes={[50, 50]}
        minSize={320}
        gutterSize={3}
      >
        <div className="pl-4 pr-1">
          <div className="bg-white border border-zinc-300 rounded-xl h-full overflow-hidden">
            <div className="flex gap-2 items-center px-4 bg-zinc-50 h-12 border-b border-zinc-200 ">
              <Link
                to={`/problems/${slug}/description`}
                className="flex items-center py-1 px-2 rounded-md dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200"
              >
                <BookText color="#007BFF" size={16}/> 
                <span className="ml-1">Description</span>
              </Link>
              <div className="w-px h-4 bg-zinc-400 dark:bg-zinc-700" />
              <Link
                to={`/problems/${slug}/submissions`}
                className="flex items-center py-1 px-2 rounded-md dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200"
              >
                <CircleFadingArrowUp color="blue" size={16}/>
                <span className="ml-1">Submissions</span>
              </Link>
            </div>
            <Outlet context={{
              ...problemInfo,
              loading
            }}/>
          </div>
        </div>
        
        <Split
          direction="vertical"
          className="h-full pl-1 pr-4"
          sizes={[70, 30]}
          minSize={120}
          gutterSize={3}
        >
          <div className="pb-1">
            <div className="pb-4 flex flex-col bg-white border border-zinc-300 rounded-xl h-full overflow-hidden">
              <div className="px-4 flex items-center justify-between mb-4 bg-zinc-50 border-b border-zinc-200 h-12">
                <LangSelector language={language} setLanguage={setLanguage}/>
                <Button size="icon" variant="ghost" onClick={handleResetCode}>
                  <RotateCcw />
                </Button>
              </div>
              <div className="grow overflow-hidden">
                <CodeEditor 
                  codeSnippets={codeSnippets} 
                  setCodeSnippets={setCodeSnippets} 
                  selectedLanguage={language} 
                  loading={loading}
                  error={error}
                  initialCodeSnippets={initialCodeSnippets}
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="bg-white border border-zinc-300 rounded-xl h-full overflow-hidden">
              <TestcaseNavbar activeView={testcaseView} setActiveView={setTestcaseView}/>
              {testcaseView === "testcase" ? (
                <TestcaseCard 
                  variableNames={paramName} 
                  testCases={testCases} 
                  setTestCases={setTestCases} 
                  loading={loading}
                  error={error}
                />
              ) : (
                <TestcaseResults
                  testCases={testCases}
                  executionResult={executionResult}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  loading={runningCode}
                  variableNames={paramName}
                />
              )}
            </div>
          </div>
        </Split>
      </Split>
    </div>
  );
}
