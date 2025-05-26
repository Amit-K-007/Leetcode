import { z } from "zod";
import {
  IntegerSchema,
  IntegerArraySchema,
  StringSchema,
  StringArraySchema,
  CharacterSchema,
  CharacterArraySchema,
} from "./schema";

export function validateField(testcase: string, requiredType: string): string {
    let schema: z.ZodSchema;

    switch (requiredType) {
        case "integer":
            schema = IntegerSchema;
            break;
        case "integer[]":
            schema = IntegerArraySchema;
            break;
        case "string":
            schema = StringSchema;
            break;
        case "string[]":
            schema = StringArraySchema;
            break;
        case "character":
            schema = CharacterSchema;
            break;
        case "character[]":
            schema = CharacterArraySchema;
            break;
        default:
            throw new Error(`Unsupported requiredType from database: ${requiredType}`);
    }

    const parseResult = schema.safeParse(testcase);
    if (!parseResult.success) {
        throw new Error(`Validation failed for ${requiredType}: ${parseResult.error.message}`);
    }
    return parseResult.data;
}