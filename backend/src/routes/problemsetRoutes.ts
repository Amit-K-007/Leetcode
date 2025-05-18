import { Router } from "express";
import { getProblems } from "../controllers/problemsetController";

const router: Router = Router();

router.get('/', getProblems); 

export default router;