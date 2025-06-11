import { Request, Response } from "express";
import { getRedisClient } from "../configs/redis";
import prisma, { $Enums } from "@amit-k/prisma-shared";

interface Problem {
    id: number;
    title: string;
    titleSlug: string;
    difficulty: $Enums.Difficulty;
}

const timeout = parseInt(process.env.CENTRAL_REDIS_TIMEOUT ?? "3600");

export async function getProblems(req: Request, res: Response): Promise<void> {
    
    // const page = parseInt(req.query.page as string) || 1;

    // const allProblems = [
    //     { id: 1, title: "Two Sum", titleSlug: "two-sum", difficulty: "EASY" },
    //     { id: 2, title: "Add Two Numbers", titleSlug: "add-two-numbers", difficulty: "MEDIUM" },
    //     { id: 3, title: "Longest Substring Without Repeating Characters", titleSlug: "longest-substring-without-repeating-characters", difficulty: "MEDIUM" },
    //     { id: 4, title: "Median of Two Sorted Arrays", titleSlug: "median-of-two-sorted-arrays", difficulty: "HIGH" },
    //     { id: 5, title: "Longest Palindromic Substring", titleSlug: "longest-palindromic-substring", difficulty: "MEDIUM" },
    //     { id: 6, title: "Zigzag Conversion", titleSlug: "zigzag-conversion", difficulty: "EASY" },
    //     { id: 7, title: "Reverse Integer", titleSlug: "reverse-integer", difficulty: "EASY" },
    //     { id: 8, title: "String to Integer (atoi)", titleSlug: "string-to-integer-atoi", difficulty: "MEDIUM" },
    //     { id: 9, title: "Palindrome Number", titleSlug: "palindrome-number", difficulty: "EASY" },
    //     { id: 10, title: "Regular Expression Matching", titleSlug: "regular-expression-matching", difficulty: "HIGH" },
    // ];

    // const pageSize = 4;
    // const start = (page - 1) * pageSize;
    // const end = start + pageSize;

    // const paginatedProblems = allProblems.slice(start, end);

    // res.status(200).json({
    //     data: paginatedProblems,
    //     currentPage: page,
    //     totalPages: Math.ceil(allProblems.length / pageSize),
    //     totalItems: allProblems.length,
    //     limit: pageSize,
    // });
    // return;

    try {
        const limit = 10;
        const page = parseInt(req.query.page as string) || 1;
        const search = req.query.search ? (req.query.search as string).trim() : "";
        
        const problemCount = await getProblemCount(search);
        if (problemCount == 0) {
            res.status(200).json({
              data: [],
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
              limit,
            });
            return;
        }

        const totalPages = Math.ceil(problemCount / limit);
        const adjustedPage = Math.min(Math.max(1, page), totalPages);
        const skip = (adjustedPage - 1) * limit;

        const problems = await getPageProblems(adjustedPage, skip, limit, search);
        res.status(200).json({
            data: problems,
            currentPage: adjustedPage,
            totalPages,
            totalItems: problemCount,
            limit,
        });
        return;
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

async function getProblemCount(search: string): Promise<number> {
    if (search === "") {
        const redisClient = await getRedisClient();
        const cacheKey = "problem:count";

        const cachedCount = await redisClient.get(cacheKey);
        if (cachedCount !== null) {
        return parseInt(cachedCount);
        }

        const count = await prisma.problem.count();
        await redisClient.setEx(cacheKey, timeout, count.toString());
        return count;
    }

    return prisma.problem.count({
        where: {
            title: {
                contains: search,
                mode: "insensitive",
            },
        },
    });
}

async function getPageProblems(page: number, skip: number, take: number, search: string): Promise<Problem[]> {
    let redisClient;
    let cacheKey;
    if(search === "") {
        redisClient = await getRedisClient();
        cacheKey = `problems:${page}:${take}`;
    
        const cachedProblems = await redisClient.get(cacheKey);
        if(cachedProblems) {
            return JSON.parse(cachedProblems);
        }
    }

    const problems = await prisma.problem.findMany({
        select:{
            id: true,
            title: true,
            titleSlug: true,
            difficulty: true,
        },
        where: search !== ""
            ? {
                title: {
                    contains: search,
                    mode: "insensitive",
                },
            }
            : {},
        skip,
        take,
        orderBy: {
            id: 'asc',
        }
    });

    if(search === "" && redisClient && cacheKey) {
        await redisClient.setEx(cacheKey, timeout , JSON.stringify(problems));
    }

    return problems;
}
