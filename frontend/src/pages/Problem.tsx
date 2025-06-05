import { ProblemNavbar } from "@/components/problem/ProblemNavbar";
import { BookText, CircleFadingArrowUp } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";
import Split from 'react-split'

export function Problem() {
  const { slug } = useParams();

  return (
    <div className="h-screen w-screen bg-zinc-100 flex flex-col">
      <ProblemNavbar />
      <Split
        className="flex flex-1"
        sizes={[50, 50]}
        minSize={80}
        gutterSize={2}
      >
        {/* Left: Problem Description */}
        <div className="pl-4 pb-4 pr-1">
          <div className="bg-white border border-zinc-300 rounded-xl p-4 h-full">
            <div className="flex gap-2 items-center">
              <Link
                to={`/problems/${slug}/description`}
                className="flex items-center p-1 rounded-md dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
              >
                <BookText color="#007BFF" size={20}/> 
                <span className="ml-1">Description</span>
              </Link>
              <div className="w-px h-4 bg-zinc-400 dark:bg-zinc-700" />
              <Link
                to={`/problems/${slug}/submissions`}
                className="flex items-center p-1 rounded-md dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
              >
                <CircleFadingArrowUp color="blue" size={20}/>
                <span className="ml-1">Submissions</span>
              </Link>
            </div>
            <Outlet />
          </div>
        </div>

        {/* Right: Code Editor + Output Panel */}
        <Split
          direction="vertical"
          className="h-full"
          sizes={[70, 30]}
          minSize={80}
          gutterSize={6}
        >
          {/* Top: Code Editor */}
          <div className="pr-4 pb-2 pl-1">
            <div className="bg-white border border-zinc-300 rounded-xl p-4 h-full">
              {/* Your Code Editor goes here */}
              <textarea
                className="w-full h-full bg-zinc-50 text-white p-4 rounded-xl outline-none resize-none"
                placeholder="// Write your code here..."
              />
            </div>
          </div>

          {/* Bottom: Output/Testcase Panel */}
          <div className="pr-4 pb-4 pl-1">
            <div className="bg-white border border-zinc-300 rounded-xl p-4 h-full">
              <h3 className="text-sm font-medium mb-1">Testcase Result</h3>
              <pre className="text-sm text-zinc-300">
                Output will appear here...
              </pre>
            </div>
          </div>
        </Split>
      </Split>
    </div>
  );
}
