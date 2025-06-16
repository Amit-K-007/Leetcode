import { Request, Response } from "express";
import prisma from "@amit-k/prisma-shared";
import { answerInput, submissionInput } from "../schemas";
import { AuthRequest } from "../middlewares";
import { getRedisClient } from "../configs/redis";

export async function getProblemData(req: Request, res: Response): Promise<void> {
    try {
        const { problemSlug } = req.params;
        const problem = await prisma.problem.findUnique({
            where: {
                titleSlug: problemSlug,
            },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                functionName: true,
                testCases: {
                    select: {
                        input: true,
                        output: true,
                    }
                },
                paramName: true,
                codeSnippets: {
                    select: {
                        language: true,
                        code: true,
                    }
                }
            }
        });
        if(!problem) {
            res.status(400).json({
                message: "Problem doesn't exist",
            });
            return;
        }

        res.status(200).json({
            data: {
                ...problem,
                testCaseCount: problem.testCases.length
            },
        });
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function interpretSolution(req: AuthRequest, res: Response): Promise<void> {
    try {
        const body = req.body;
        const result = submissionInput.safeParse(body);
        if(!result.success) {
            res.status(400).json({
                message: 'Invalid input',
                errors: result.error.issues,
            });
            return;
        }
        
        const problem = await prisma.problem.findUnique({
            where: {
                id: parseInt(result.data.questionId),
            }
        });
        if(!problem) {
            res.status(400).json({
                message: 'Invalid question ID',
            });
            return;
        }

        body["functionName"] = problem.functionName;
        body["systemCode"] = problem.systemCode;
        body["paramType"] = problem.paramType;
        body["returnType"] = problem.returnType;
        body["isAnswer"] = false;
        body["userId"] =    req.user?.userId;

        const redisClient = await getRedisClient();
        await redisClient.rPush("SUBMISSION_QUEUE", JSON.stringify(body));
        res.status(200).json({
            message: "Solution submitted for evaluation",
        });
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function submitSolution(req: AuthRequest, res: Response): Promise<void> {
    try {
        const body = req.body;
        const result = answerInput.safeParse(body);
        if(!result.success) {
            res.status(400).json({
                message: 'Invalid input',
                errors: result.error.issues,
            });
            return;
        }
        
        const problem = await prisma.problem.findUnique({
            where: {
                id: parseInt(result.data.questionId),
            },
            include: {
                testCases: true,
            }
        });
        if(!problem) {
            res.status(400).json({
                message: 'Invalid question ID',
            });
            return;
        }
        
        body["functionName"] = problem.functionName;
        body["dataInput"] = "";
        body["systemCode"] = "";
        body["paramType"] = problem.paramType;
        body["returnType"] = problem.returnType;
        body["isAnswer"] = true;
        body["userId"] =    req.user?.userId;

        problem.testCases.forEach((testCase, index) => {
            body["dataInput"] += testCase.input;
            body["systemCode"] += testCase.output;    
            if (index !== problem.testCases.length - 1) {
                body["dataInput"] += "\n";
                body["systemCode"] += "\n";
            }
        });

        const redisClient = await getRedisClient();
        await redisClient.rPush("SUBMISSION_QUEUE", JSON.stringify(body));
        res.status(200).json({
            message: "Solution submitted for evaluation",
        });
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function getSubmissions(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { problemSlug } = req.params;
        const submissions = await prisma.submission.findMany({
            where: {
                userId: req.user?.userId,
                problem: {
                    titleSlug: problemSlug,
                },
            },
            select: {
                id: true,
                status: true,
                language: true,
                executionTime: true,
                executionMemory: true,
            }
        });
        if(submissions.length === 0) {
            res.status(200).json({
                message: `Submissions not available for ${problemSlug}`,
            });
            return;
        }

        res.status(200).json({
            submissions,
        });
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function getSubmissionDetail(req: AuthRequest, res: Response): Promise<void> {
    try {
        const { submissionId } = req.params;
        const submissionDetail = await prisma.submission.findUnique({
            where: {
                id: submissionId,
            }
        });
        if(!submissionDetail) {
            res.status(400).json({
                message: "Submissions details not found",
            });
            return;
        }

        res.status(200).json({
            submissionDetail,
        });
    } 
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}
