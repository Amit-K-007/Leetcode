import { SquareCheck, Terminal } from "lucide-react";
import { Button } from "../ui/button";

export function TestcaseNavbar() {
  return (
    <div className="px-4 flex items-center h-12 bg-zinc-50 border-b border-zinc-200 gap-2">
      <Button
        variant="ghost"
        className="font-light dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200"
      >
        <SquareCheck className="text-[#0acd00]"/>
        <span className="text-black">Testcase</span>
      </Button>
      <div className="w-px h-4 bg-zinc-400 dark:bg-zinc-700" />
      <Button
        variant="ghost"
        className="font-light dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-200"
      >
        <Terminal className="text-[#0acd00]"/>
        <span className="text-black">Test Result</span>
      </Button>
    </div>
  );
}