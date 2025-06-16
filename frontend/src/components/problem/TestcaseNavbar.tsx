import { SquareCheck, Terminal } from "lucide-react";
import { Button } from "../ui/button";

interface TestcaseNavbarProps {
  activeView: 'testcase' | 'results';
  setActiveView: (view: 'testcase' | 'results') => void;
}

export function TestcaseNavbar({ activeView, setActiveView }: TestcaseNavbarProps) {
  return (
    <div className="px-4 flex items-center h-12 bg-zinc-50 border-b border-zinc-200 gap-2">
      <Button
        variant="ghost"
        className={`font-light hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200 ${
          activeView === 'testcase' ? '' : 'opacity-50'
        }`}
        onClick={() => setActiveView('testcase')}
        aria-selected={activeView === 'testcase'}
        role="tab"
      >
        <SquareCheck className="text-[#0acd00]"/>
        <span className="text-black">Testcase</span>
      </Button>
      <div className="w-px h-4 bg-zinc-400 dark:bg-zinc-700" />
      <Button
        variant="ghost"
        className={`font-light hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200 ${
          activeView === 'results' ? '' : 'opacity-50'
        }`}
        onClick={() => setActiveView('results')}
        aria-selected={activeView === 'results'}
        role="tab"
      >
        <Terminal className="text-[#0acd00]"/>
        <span className="text-black">Test Result</span>
      </Button>
    </div>
  );
}