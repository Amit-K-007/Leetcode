"use client"

import { useEffect, useState } from "react"
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

interface Problem {
  id: number
  title: string
  titleSlug: string
  difficulty: string
  hasSolved?: boolean
}

const hardcodedProblems: Problem[] = [
  { id: 1, title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy", hasSolved: false },
  { id: 2, title: "Add Two Numbers", titleSlug: "add-two-numbers", difficulty: "Med.", hasSolved: true },
  { id: 3, title: "Longest Substring Without Repeating Characters", titleSlug: "longest-substring-without-repeating-characters", difficulty: "Med.", hasSolved: true },
  { id: 4, title: "Median of Two Sorted Arrays", titleSlug: "median-of-two-sorted-arrays", difficulty: "Hard" },
  { id: 5, title: "Valid Parentheses", titleSlug: "valid-parentheses", difficulty: "Easy", hasSolved: false },
]

export function ProblemList() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchProblems = async () => {
      // setLoading(true)
      // const res = await fetch(`/api/problems?page=${page}&search=${search}`)
      // const result = await res.json()
      // setProblems(result.data)
      // setTotalPages(result.totalPages)
      // setLoading(false)

      setLoading(true)

      // Simulate API delay
      // await new Promise((resolve) => setTimeout(resolve, 1000))

      // Filter and paginate hardcoded data here:
      const filtered = hardcodedProblems.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )

      // Pagination variables
      const limit = 5
      const total = filtered.length
      const totalPages = Math.max(1, Math.ceil(total / limit))
      const adjustedPage = Math.min(Math.max(1, page), totalPages)
      const start = (adjustedPage - 1) * limit
      const paginated = filtered.slice(start, start + limit)

      setProblems(paginated)
      setTotalPages(totalPages)
      setLoading(false)
    }

    fetchProblems()
  }, [page, search])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to first page on new search
  }
  

  return (
    <div className="space-y-4 mt-2">
      <div className="relative max-w-sm">
        <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
            size={18}
        />
        <Input
            placeholder="Search problems..."
            value={search}
            onChange={handleSearch}
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
