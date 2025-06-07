import { CardLogo } from "@/components/common/CardLogo";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CloudUpload, List, SquareChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function ProblemNavbar() {
  return (
    <div className="px-8 h-12 w-full flex items-center relative">
      <div className="flex items-center gap-2">
        <CardLogo size="h-7" />
        <Button
          size={null}
          variant="ghost"
          className="px-2 text-lg font-light bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <List style={{ width: "20px", height: "20px" }} />
          Problem List
        </Button>
        <Link
          to="/"
          className="rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <ChevronLeft strokeWidth={1} size={26} />
        </Link>
        <Link
          to="/"
          className="rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <ChevronRight strokeWidth={1} size={26} />
        </Link>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <Button
          size={null}
          variant="ghost"
          className="p-1.5 font-light bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <SquareChevronRight style={{ width: "20", height: "20px" }} />
        </Button>
        <Button
          size={null}
          variant="ghost"
          className="py-1 px-2 text-[#0acd00] ml-2 text-md bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400 hover:text-green-600"
        >
          <CloudUpload style={{ width: "20", height: "20" }} />
          Submit
        </Button>
      </div>
      <div className="ml-auto flex gap-2 text-md font-light">
        <Link to="/signup" className="hover:font-normal ">
          Register
        </Link>
        or
        <Link to="/login" className="hover:font-normal">
          Sign in
        </Link>
      </div>
    </div>
  );
}
