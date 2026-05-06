// ===============================
// 📘 SISTEM ABSENSI QR UNIYAP
// File: src/server.js (SUPABASE VERSION FINAL)
// ===============================

import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import { PrismaClient } from "@prisma/client";
import http from "http";
import { Server } from "socket.io";
import apiRoutes from "./routes/apiRoutes.js";

// ===============================
// ⚙️ Init
// ===============================
dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ===============================
// 🧩 Middleware Global
// ===============================
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());
app.use("/api", apiRoutes);

// ===============================
// 🖼️ Static Files
// ===============================
app.use(express.static(path.join(__dirname, "../public")));
app.use("/qrcodes", express.static(path.join(__dirname, "../public/qrcodes")));

// ===============================
// 🎨 EJS
// ===============================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
app.set("view cache", IS_PRODUCTION);

// ===============================
// 📦 Routes
// ===============================
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import dosenRoutes from "./routes/dosenRoutes.js";
import lecturerRoutes from "./routes/lecturerRoutes.js";
import mahasiswaRoutes from "./routes/mahasiswaRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";

app.set("io", io);

// ===============================
// 🏠 Landing
// ===============================
app.get("/", async (req, res) => {
  try {
    const setting = (await prisma.setting.findFirst()) || {
      systemName: "Sistem Absensi QR UNIYAP",
      slogan: "Digital, Efisien, dan Akurat",
      systemLogo: "/img/logo kampus.png",
      darkMode: false,
    };

    res.render("portal", {
      systemName: setting.systemName,
      logoPath: setting.systemLogo,
      slogan: setting.slogan,
      darkMode: setting.darkMode,
      year: new Date().getFullYear(),
    });
  } catch (err) {
    console.error("❌ Portal Error:", err);
    res.status(500).send("Gagal memuat portal utama");
  }
});

// ===============================
// ⚙️ Route register
// ===============================
app.use("/auth", authRoutes);
app.use("/dashboard/admin", adminRoutes);
app.use("/dashboard/dosen", dosenRoutes);
app.use("/dashboard/dosen", lecturerRoutes);
app.use("/dashboard/mahasiswa", mahasiswaRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/scan", scanRoutes);

// ===============================
// 404 Log
// ===============================
app.use((req, res, next) => {
  console.warn(`⚠️ 404: ${req.originalUrl}`);
  next();
});

// ===============================
// 404 Page
// ===============================
app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// ===============================
// 🚀 Start Server + DB connect
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, async () => {
  try {
    console.log("⏳ Connecting to DB...");
    await prisma.$connect();
    console.log("✅ Database terhubung");
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🌐 Mode: ${IS_PRODUCTION ? "Prod" : "Dev"}`);
  } catch (err) {
    console.error("❌ Gagal connect DB:", err.message);
  }
});

// ===============================
// 🌐 Socket.IO
// ===============================
io.on("connection", (socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on("admin:add", (data) => io.emit("admin:update", data));

  socket.on("disconnect", () =>
    console.log(`🔴 Socket disconnected: ${socket.id}`)
  );
});
