import { Router } from "express";
import { getProblemData, interpretSolution, submitSolution } from "../controllers/problemsController";
import { tokenValidator } from "../middlewares";

const router = Router();

router.get("/:problemSlug", getProblemData);
router.post("/:problemSlug/interpret_solution", tokenValidator, interpretSolution);
router.post("/:problemSlug/submit", tokenValidator, submitSolution);

export default router;