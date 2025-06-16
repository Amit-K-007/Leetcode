import { Router } from "express";
import { getProblemData, interpretSolution, submitSolution, getSubmissions, getSubmissionDetail } from "../controllers/problemsController";
import { tokenValidator } from "../middlewares";

const router = Router();

router.get("/:problemSlug", getProblemData);
router.post("/:problemSlug/interpret_solution", tokenValidator, interpretSolution);
router.post("/:problemSlug/submit", tokenValidator, submitSolution);
router.get("/:problemSlug/submissions", tokenValidator, getSubmissions);
router.get("/:problemSlug/submissions/:submissionId", tokenValidator, getSubmissionDetail);

export default router;