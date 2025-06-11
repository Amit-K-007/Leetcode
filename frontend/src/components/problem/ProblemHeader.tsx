import { CheckCircle } from "lucide-react";

export function ProblemHeader({ title }: Readonly<{ title: string }>) {
  return (
    <div className="my-4 flex flex-col">
      <div className="flex items-center">
        <div className="text-2xl font-bold grow">
          1. {title}
        </div>
        <div className="flex items-center gap-2 mr-4 font-light text-md">
          Solved <CheckCircle size={16} className="text-green-500 mx-auto" />
        </div>
      </div>
      <div className="mt-4 mr-auto bg-zinc-100 px-3 py-1 rounded-lg text-teal-500">Easy</div>
    </div>
  );
}