import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
    userId: string,
}

export interface AuthRequest extends Request {
    user?: TokenPayload,
}

export function tokenValidator(req: AuthRequest, res: Response, next: NextFunction): void {
    const authToken = req.headers.authorization;

    if(!authToken || !authToken.startsWith("Bearer_")) {
        res.status(400).json({
            message: "User not authenticated",
        });
        return;
    }

    const token = authToken.split("Bearer_")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
        req.user = decoded;
        next();
    } catch(error) {
        if(error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                message: 'Invalid token',
            });
        }
        else {
            res.status(500).json({
                message: 'Token validation error',
            });
        }
    }
}