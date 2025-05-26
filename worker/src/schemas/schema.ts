import { z } from "zod";

export const IntegerSchema = z.string().transform((val, ctx) => {
    const num = parseInt(val);
    if (isNaN(num)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid integer",
        });
        return z.NEVER;
    }
    return num.toString(); // return string version of integer
});

export const IntegerArraySchema = z.string().transform((val, ctx) => {
    try {
        const parsed = JSON.parse(val);
        if (
            !Array.isArray(parsed) ||
            !parsed.every((n: any) => Number.isInteger(n))
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid integer array",
            });
            return z.NEVER;
        }
        return parsed.join(" "); // space-separated string of integers
    } catch {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid integer array format",
        });
        return z.NEVER;
    }
});

export const StringSchema = z.string();
// no transform needed, string input returns string output

export const StringArraySchema = z.string().transform((val, ctx) => {
    try {
        const parsed = JSON.parse(val);
        if (
            !Array.isArray(parsed) ||
            !parsed.every((s: any) => typeof s === "string")
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid string array",
            });
            return z.NEVER;
        }
        return parsed.map((s: string) => s.trim()).join(" ");
    } catch {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid string array format",
        });
        return z.NEVER;
    }
});

export const CharacterSchema = z
    .string()
    .length(1, { message: "Must be a single character" });
// already returns a string of length 1

export const CharacterArraySchema = z.string().transform((val, ctx) => {
    try {
        const parsed = JSON.parse(val);
        if (
            !Array.isArray(parsed) ||
            !parsed.every((c: any) => typeof c === "string" && c.length === 1)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Invalid character array",
            });
            return z.NEVER;
        }
        return parsed.join(" ");
    } catch {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid character array format",
        });
        return z.NEVER;
    }
});
