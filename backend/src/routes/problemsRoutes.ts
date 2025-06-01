import { Router } from "express";
import { getDescription, redirectDescription, redirectProblemset, interpretSolution, submitSolution } from "../controllers/problemsController";
import { tokenValidator } from "../middlewares";

const router = Router();

router.get("/", redirectProblemset);
router.get("/:problemSlug", getDescription);
router.get("/:problemSlug/description", getDescription);
router.get("/:problemSlug/description/*extraPath", redirectDescription);
router.post("/:problemSlug/interpret_solution", tokenValidator, interpretSolution);
router.post("/:problemSlug/submit", tokenValidator, submitSolution);

export default router;