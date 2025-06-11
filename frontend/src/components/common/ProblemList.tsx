"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { Search } from "lucide-react"
import { ProblemRow } from "./ProblemRow"
import axios from "axios"
import { debounce } from "@/lib/debounce"

interface Problem {
  id: number
  title: string
  titleSlug: string
  difficulty: string
  hasSolved?: boolean
}

const API_URL = import.meta.env.VITE_API_URL;

export function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [search, setSearch] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/problemset`, {
          params: {
            page,
            search,
          },
        });
  
        const fetchedProblems: Problem[] = res.data.data.map((problem: Problem) => ({
          id: problem.id,
          title: problem.title,
          titleSlug: problem.titleSlug,
          difficulty: problem.difficulty, 
          hasSolved: null, 
        }));
  
        setProblems(fetchedProblems);
        setTotalPages(res.data.totalPages);
      } catch (error) {
        console.error("Error fetching problems:", error);
        setProblems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [page, search])

  const handleSearch = useMemo(() =>
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 1000),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value); 
    setLoading(true);
    handleSearch(value);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="relative max-w-sm">
        <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            size={18}
        />
        <Input
            placeholder="Search problems..."
            value={inputValue}
            onChange={handleInputChange}
            className="pl-9"
        />
      </div>
      <div className="rounded-md border">
        <Table className="text-md">
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : problems.length ? (
              problems.map((p) => (
                <ProblemRow problem={p}/>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  No problems found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
