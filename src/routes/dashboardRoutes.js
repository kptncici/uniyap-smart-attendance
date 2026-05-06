// src/routes/dashboardRoutes.js
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", (req, res) => {
  // portal dashboard landing: if logged in redirect to appropriate dashboard
  // but normal portal root is handled in server.js (this route used for /dashboard base)
  res.redirect("/");
});

// single routes: protected dashboards (will render templates or redirect)
router.get("/admin", verifyToken, (req, res) => {
  if (req.user.role !== "ADMIN") return res.redirect("/");
  res.redirect("/dashboard/admin");
});
router.get("/dosen", verifyToken, (req, res) => {
  if (req.user.role !== "LECTURER") return res.redirect("/");
  res.redirect("/dashboard/dosen");
});
router.get("/mahasiswa", verifyToken, (req, res) => {
  if (req.user.role !== "STUDENT") return res.redirect("/");
  // implement mahasiswa dashboard later (for now redirect to portal)
  res.send("Dashboard Mahasiswa - fitur diimplementasi nanti.");
});

export default router;
