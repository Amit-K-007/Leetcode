import { Request, Response } from "express";
import { prisma } from "../configs/db";
import { answerInput, submissionInput } from "../schemas";
import { AuthRequest } from "../middlewares";
import { getRedisClient } from "../configs/redis";

export function redirectProblemset(req: Request, res: Response): void {
    res.redirect(301, `/api/v1/problemset`);
}

export async function getDescription(req: Request, res: Response): Promise<void> {
    try {
        const { problemSlug } = req.params;
        const problem = await prisma.problem.findUnique({
            where: {
                titleSlug: problemSlug,
            },
            include: {
                testCases: true
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

export function redirectDescription(req: Request, res: Response): void {
    const { problemSlug } = req.params;
    res.redirect(301, `/api/v1/problems/${problemSlug}/description`);
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