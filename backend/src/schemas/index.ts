import { z } from "zod";

export const loginInput = z.object({
    email: z.string().email(),
    password: z.string().trim().min(6).max(30)
});

export type LoginInput = z.infer<typeof loginInput>;

export const signupInput = z.object({
    username: z.string().trim().min(3).max(30),
    email: z.string().email(),
    password: z.string().trim().min(6).max(30)
});

export type SignupInput = z.infer<typeof signupInput>;

export const submissionInput = z.object({
    questionId: z.string(),
    language: z.enum(["PYTHON", "JAVA", "CPP"]),
    dataInput: z.string(),
    userCode: z.string(),
});

export type SubmissionInput = z.infer<typeof submissionInput>;

export const answerInput = z.object({
    questionId: z.string(),
    language: z.enum(["PYTHON", "JAVA", "CPP"]),
    userCode: z.string(),
});

export type AnswerInput = z.infer<typeof answerInput>;
