import { CardLogo } from "@/components/common/CardLogo";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CloudUpload, List, SquareChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function ProblemNavbar() {
  return (
    <div className="px-8 h-16 w-full flex items-center relative">
      <div className="flex items-center gap-2">
        <CardLogo size="h-8" />
        <Button
          variant="ghost"
          className="text-xl font-light bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <List style={{ width: "25px", height: "25px" }} />
          Problem List
        </Button>
        <Link
          to="/"
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <ChevronLeft strokeWidth={1} size={30} />
        </Link>
        <Link
          to="/"
          className="p-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <ChevronRight strokeWidth={1} size={30} />
        </Link>
      </div>
      <div className="absolute left-1/2 -translate-x-1/2">
        <Button
          variant="ghost"
          className="font-light bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
        >
          <SquareChevronRight style={{ width: "25px", height: "25px" }} />
        </Button>
        <Button
          variant="ghost"
          className="text-green-600 ml-2 text-lg bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400 hover:text-green-500"
        >
          <CloudUpload style={{ width: "25px", height: "25px" }} />
          Submit
        </Button>
      </div>
      <div className="ml-auto flex gap-2 text-lg font-light">
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
