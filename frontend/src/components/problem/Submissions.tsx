import { Clock, Cpu } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

type Submission = {
  status: string;
  language: string;
  runtime: string;
  memory: string;
};

const submissions: Submission[] = [
  { status: "Accepted", language: "C++", runtime: "2 ms", memory: "14.8 MB" },
  { status: "Wrong Answer", language: "Java", runtime: "3 ms", memory: "16.1 MB" },
  { status: "Time Limit Exceeded", language: "Python", runtime: "N/A", memory: "N/A" },
  { status: "Accepted", language: "C", runtime: "1 ms", memory: "13.2 MB" },
];

export function Submissions() {
  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto px-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead className="font-light">Status</TableHead>
            <TableHead className="font-light">Language</TableHead>
            <TableHead className="font-light">Runtime</TableHead>
            <TableHead className="font-light">Memory</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission, index) => (
            <TableRow key={index}>
              <TableCell className="text-gray-600 font-medium">{index + 1}</TableCell>
              <TableCell
                className={submission.status === "Accepted" ? "text-green-600" : "text-red-600"}
              >
                {submission.status}
              </TableCell>
              <TableCell className="text-gray-600">{submission.language}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock size={16} />
                  <span>{submission.runtime}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-gray-600">
                  <Cpu size={16} />
                  <span>{submission.memory}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
