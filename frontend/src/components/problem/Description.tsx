import { useOutletContext } from "react-router-dom";
import { ProblemHeader } from "./ProblemHeader";

interface OutletContext {
  title: string;
  description : string;
  loading: boolean;
}

export function Description() {
  const { title, description, loading } = useOutletContext<OutletContext>()
  return (
    <div className="h-[calc(100vh-8rem)] overflow-auto px-4">
      <ProblemHeader title={title} />
      <div
        className=" prose max-w-none text-zinc-800 dark:text-zinc-200 text-md"
        dangerouslySetInnerHTML={{
          __html: loading ? "Loading ..." : description,
        }}
      />
    </div>
  );
}
