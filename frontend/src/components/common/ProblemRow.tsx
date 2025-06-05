import { Link } from "react-router-dom";
import { TableCell, TableRow } from "../ui/table";
import { CheckCircle, Circle } from "lucide-react";

interface Problem {
  id: number;
  title: string;
  titleSlug: string;
  difficulty: string;
  hasSolved?: boolean;
}

interface ProblemRowProps {
  problem: Problem;
}

export function ProblemRow({ problem }: Readonly<ProblemRowProps>) {
  return (
    <TableRow key={problem.id}>
      <TableCell className="w-8 text-center pl-6">
        {problem.hasSolved === true? (
          <CheckCircle size={16} className="text-green-500 mx-auto" />
        ) : problem.hasSolved === false ? (
          <Circle size={16} className="text-yellow-500 mx-auto" />
        ) : null
        }
      </TableCell>
      <TableCell className="w-8">{problem.id}</TableCell>
      <TableCell className="w-[88%] max-w-[200px] truncate">
        <Link to={`/problems/${problem.titleSlug}`} className="hover:underline">
          {problem.title}
        </Link>
      </TableCell>
      <TableCell 
        className={
          problem.difficulty === "Easy"
            ? "text-green-600 pr-6"
            : problem.difficulty === "Med."
            ? "text-yellow-500 pr-6"
            : "text-red-600 pr-6"
        }
      >{problem.difficulty}</TableCell>
    </TableRow>
  );
}
