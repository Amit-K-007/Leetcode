import { Navbar } from "@/components/common/Navbar"
import { ProblemList } from "@/components/common/ProblemList"

export function ProblemSet() {
  return (
    <div className="px-8 py-2 bg-zinc-50 dark:bg-zinc-900">
      <Navbar />
      <ProblemList />
    </div>
  ) 
}
