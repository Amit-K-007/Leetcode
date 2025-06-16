import { Clock, Cpu } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

type Submission = {
  id: string,
  status: string;
  language: string;
  executionTime: string;
  executionMemory: string;
};

const API_URL = import.meta.env.VITE_API_URL;

export function Submissions() {
  const { slug } = useParams<{ slug: string }>(); 
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const submissionData = await axios.get<{submissions: Submission[]}>(`${API_URL}/problems/${slug}/submissions`, {
          headers: {
            Authorization: token,
          }
        });
        const submissions = submissionData.data.submissions;
        setSubmissions(submissions);
      } catch (error) {
        console.log(error);
      }
    }
    if(token) {
      fetchSubmissions();
    }
  }, [slug, token]);


  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto px-4">
      {submissions.length > 0 ? 
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
                  className={`capitalize cursor-pointer ${submission.status === "ACCEPTED" ? "text-green-600" : "text-red-600"}`}
                  onClick={() => { navigate(`${submission.id}`) }}
                >
                  {submission.status.replace(/_/g, " ").toLowerCase()}
                </TableCell>
                <TableCell className="text-gray-600">{submission.language}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Clock size={16} />
                    <span>{submission.executionTime ? submission.executionTime : "N/A"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Cpu size={16} />
                    <span>{submission.executionMemory ? submission.executionMemory : "N/A"}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table> :
        <div className="flex flex-col items-center mt-20 gap-2">
          <span className="font-medium">🔥 Join LeetCode to Code!</span>
          <span>View your Submission records here</span>
          <Button asChild variant="outline" className="bg-green-500 !text-white hover:bg-green-600">
            <Link to="/login" state={{ from: location.pathname }}>Register or Sign in</Link>
          </Button>
        </div>
      }
    </div>
  );
}
