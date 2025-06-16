import { CardLogo } from "@/components/common/CardLogo";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger,  }  from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft, ChevronRight, CloudUpload, List, LoaderIcon, SquareChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface ProblemNavbarProps {
  handleSubmission: () => void;
  handleAnswer: () => void;
  runningCode: boolean;
  submittingAnswer: boolean;
}

export function ProblemNavbar({ handleSubmission, handleAnswer, runningCode, submittingAnswer }: Readonly<ProblemNavbarProps>) {
  const location = useLocation();
  const { token, setToken } = useAuth();

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
        {token === null ? (
          <Tooltip>
            <TooltipTrigger>
              <Button
                size={null}
                variant="ghost"
                className="p-1.5 font-light bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
                disabled
              >
                <SquareChevronRight style={{ width: "20", height: "20px" }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Please login to Run code</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            size={null}
            variant="ghost"
            className="p-1.5 font-light bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400"
            onClick={handleSubmission}
          >
            {runningCode ? 
              <LoaderIcon className="animate-spin" /> 
            :
              <SquareChevronRight style={{ width: "20", height: "20px" }} />
            }
          </Button>
        )}

        {/* Second Button - Submit */}
        {token === null ? (
          <Tooltip>
            <TooltipTrigger>
              <Button
                size={null}
                variant="ghost"
                className="py-1 px-2 text-[#0acd00] ml-2 text-md bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400 hover:text-green-600"
                disabled
              >
                <CloudUpload style={{ width: "20", height: "20" }} />
                Submit
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Please login to Submit code</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            size={null}
            variant="ghost"
            className="py-1 px-2 text-[#0acd00] ml-2 text-md bg-zinc-200 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:ring-1 hover:ring-zinc-400 hover:text-green-600"
            onClick={handleAnswer}
          >
            {submittingAnswer ? 
              <LoaderIcon className="animate-spin" /> 
            :
              <CloudUpload style={{ width: "20", height: "20" }} />
            }
            Submit
          </Button>
        )}
      </div>

      <div className="ml-auto flex gap-2 text-md font-light">
      {token === null ? 
        <>
          <Link to="/signup" className="hover:font-normal" state={{ from: location.pathname }}>
            Register
          </Link>
          or
          <Link to="/login" className="hover:font-normal" state={{ from: location.pathname }}>
            Sign in
          </Link>
        </> :
        <Button size="sm" onClick={() => {
          setToken(null);
          localStorage.removeItem("token");
        }}>
          Sign out
        </Button>
      }
      </div>
    </div>
  );
}
