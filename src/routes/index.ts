import { Router } from "express";
import healthRoutes from "../modules/health/health.routes";
import whatsappRoutes from "../modules/whatsapp/whatsapp.routes";

const router = Router();
// ─── Module route definitions
const moduleRoutes = [
  { path: "/health", route: healthRoutes }, // public
  { path: "/api/v1/whatsapp", route: whatsappRoutes },
];

// ─── Register all module routes
moduleRoutes.forEach((m) => router.use(m.path, m.route));
export default router;
