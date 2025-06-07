import { Request, Response } from "express";
import { getRedisClient } from "../configs/redis";
import prisma, { $Enums } from "@amit-k/prisma-shared";

interface Problem {
    id: number;
    title: string;
    titleSlug: string;
    difficulty: $Enums.Difficulty;
}

export async function getProblems(req: Request, res: Response): Promise<void> {
    try {
        const limit = 10;
        const page = parseInt(req.query.page as string) || 1;
        
        const problemCount = await getProblemCount();
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

        const problems = await getPageProblems(adjustedPage, skip, limit);
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

async function getProblemCount(): Promise<number> {
    const redisClient = await getRedisClient();
    const cacheKey = 'problem:count';
  
    const cachedCount = await redisClient.get(cacheKey);
    if (cachedCount !== null) {
      return parseInt(cachedCount);
    }
  
    const count = await prisma.problem.count();
    console.log(count);
    await redisClient.setEx(cacheKey, 3600 , count.toString());
    return count;
}

async function getPageProblems(page: number, skip: number, take: number): Promise<Problem[]> {
    const redisClient = await getRedisClient();
    const cacheKey = `problems:${page}:${take}`;

    const cachedProblems = await redisClient.get(cacheKey);
    if(cachedProblems) {
        return JSON.parse(cachedProblems);
    }

    const problems = await prisma.problem.findMany({
        select:{
            id: true,
            title: true,
            titleSlug: true,
            difficulty: true,
        },
        skip,
        take,
        orderBy: {
            id: 'asc',
        }
    });

    await redisClient.setEx(cacheKey, 3600 , JSON.stringify(problems));

    return problems;
}
