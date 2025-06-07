import { $Enums, PrismaClient, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
export { SubmissionStatus, $Enums };