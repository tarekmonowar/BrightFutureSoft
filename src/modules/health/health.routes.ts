import { Router } from "express";
import { healthCheck } from "./health.controller";

// ─── GET /health

const router = Router();

router.get("/", healthCheck);

export default router;
