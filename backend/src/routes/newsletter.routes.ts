

/**

* @file newsletter.routes.ts
*@desc Newsletter subscription routes — public.
*IMPORTANT route ordering:
*Single static route — no dynamic parameters.
*No ordering constraints needed.
*Corrections vs typical implementations:
*No authentication required (public endpoint)
*Rate limiting should be applied at app level
*/
import { Router } from "express";
import { subscribeNewsletter } from "../controllers/newsletter.controller";

const router = Router();

// ── Public subscription (no token required) ─────────────────────────────────
router.post("/subscribe", subscribeNewsletter);

export default router;
