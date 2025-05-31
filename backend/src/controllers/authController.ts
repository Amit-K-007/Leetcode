import { Request, Response } from "express";
import { prisma } from "../configs/db";
import { loginInput, signupInput } from "../schemas";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function signup(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body;
        const result = signupInput.safeParse(body);
        if(!result.success) {
            res.status(400).json({
                message: 'Invalid input',
                errors: result.error.issues,
            });
            return;
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { username: body.username },
                ]
            }
        });
        if(existingUser) {
            res.status(400).json({
                message: existingUser.email == body.email
                ? "Email already registered"
                : "Username already registered"
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(body.password, 10);
        const user = await prisma.user.create({
            data: {
                name: body.username,
                username: body.username,
                email: body.email,
                password: hashedPassword,
            },
            select: {
                id: true,
            }
        });
        
        const token = jwt.sign({userId: user.id}, process.env.JWT_SECRET!);
        res.status(200).json({
            message: "User registered successfully",
            token: `Bearer ${token}`,
        });
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}

export async function login(req: Request, res: Response): Promise<void> {
    try {
        const body = req.body;
        const result = loginInput.safeParse(body);
        if(!result.success) {
            res.status(400).json({
                message: 'Invalid input',
                errors: result.error.issues,
            });
            return;
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email: body.email,
            }
        });
        if(!existingUser) {
            res.status(400).json({
                message: "Email not registered",
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(body.password, existingUser.password);
        if(!isPasswordValid) {
            res.status(401).json({
                message: "Incorrect Password",
            });
            return;
        }

        const token = jwt.sign({userId: existingUser.id}, process.env.JWT_SECRET!);
        res.status(200).json({
            message: "User logged in successfully",
            token: `Bearer ${token}`,
        });
    }
    catch(error) {
        console.log(error);
        res.status(500).json({
            message: 'Internal server error',
        });
    }
}
