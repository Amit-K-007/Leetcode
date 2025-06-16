import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface SubmissionDetail {
  id: string;
  userId: string;
  problemId: number;
  code: string;
  language: string;
  status: string;
  executionTime: number;
  executionMemory: number;
  correctTestCases: number;
  totalTestCases: number;
  createdAt: string;
}

export function SubmissionDetail() {
  const { slug, submissionId } = useParams<{ slug: string, submissionId: string }>(); 
  const navigate = useNavigate();
  const { token } = useAuth();
  const [submissionDetail, setSubmissionDetail] = useState<SubmissionDetail | null>(null);

  useEffect(() => {
    const fetchSubmissionDetail = async () => {
      try {
        const res = await axios.get<{ submissionDetail: SubmissionDetail }>(`${API_URL}/problems/${slug}/submissions/${submissionId}`, {
          headers: {
            Authorization: token,
          }
        });
        const detail = res.data.submissionDetail;
        console.log(detail);
        setSubmissionDetail(detail);
      } catch (error) {
        console.log(error);
      }
    }

    fetchSubmissionDetail();
  }, [slug, submissionId, token]);

  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto p-4">
      <Link to={`/problems/${slug}/submissions`} className="flex items-center gap-2 opacity-70 hover:opacity-100">
        <ArrowLeft size={20}/>
        <span>All Submissions</span>
      </Link>
      <Separator className="my-2"/>
      {submissionDetail ? (
      <div className="flex flex-col">
        <div className="flex gap-3 items-center">
          <span className={`capitalize text-lg font-bold ${submissionDetail.status === "ACCEPTED" ? "text-green-600" : "text-red-600"}`}>
            {submissionDetail.status.replace(/_/g, " ").toLowerCase()}
          </span>
          <span className="text-sm opacity-50">
            {submissionDetail.correctTestCases} / {submissionDetail.totalTestCases} testcases passed
          </span>
        </div>
        <div className="text-sm opacity-50">
          submitted at {new Date(submissionDetail.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </div>
        <div className="flex items-center h-4 gap-2 my-4">
          <div>Code</div>
          <Separator orientation="vertical"/>
          <div>{submissionDetail.language}</div>
        </div>
        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
          {submissionDetail.code}
        </pre>
      </div>
    ) : (
      <p>Loading...</p>
    )}
    </div>
  );
}