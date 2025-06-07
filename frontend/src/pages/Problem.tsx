import { CodeEditor } from "@/components/problem/CodeEditor";
import { LangSelector } from "@/components/problem/LangSelector";
import { ProblemNavbar } from "@/components/problem/ProblemNavbar";
import { TestcaseCard } from "@/components/problem/TestcaseCard";
import { TestcaseNavbar } from "@/components/problem/TestcaseNavbar";
import { Button } from "@/components/ui/button";
import { BookText, CircleFadingArrowUp, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import Split from 'react-split'


export function Problem() {
  const { slug } = useParams<{ slug: string }>();
  const [code, setCode] = useState<string>(
    `class Solution {
  public:
    vector<int> twoSum(vector<int>& nums, int target) {
          
  }
};
    `
  );

  return (
    <div className="h-screen w-screen bg-zinc-100 flex flex-col">
      <ProblemNavbar />

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
            <Outlet />
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
                <LangSelector />
                <Button size="icon" variant="ghost">
                  <RotateCcw />
                </Button>
              </div>
              <div className="grow overflow-hidden">
                <CodeEditor code={code} setCode={setCode} language="cpp" />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <div className="bg-white border border-zinc-300 rounded-xl h-full overflow-hidden">
              <TestcaseNavbar />
              <TestcaseCard />
            </div>
          </div>
        </Split>
      </Split>
    </div>
  );
}
