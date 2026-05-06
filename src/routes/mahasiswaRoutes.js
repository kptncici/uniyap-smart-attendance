// ================================
// 🎓 Mahasiswa Routes (FINAL FIX)
// ================================
import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// ================================
// 🏠 Dashboard Mahasiswa
// ================================
router.get("/", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    const student = await prisma.student.findUnique({
      where: { nim: req.user.nim },
    });

    const history = await prisma.attendance.findMany({
      where: { studentNim: student.nim },
      orderBy: { attendanceTime: "desc" }
    });

    const setting = await prisma.setting.findFirst();

    res.render("dashboard-mahasiswa", {
      user: req.user,
      student,
      history,
      setting,
    });

  } catch (err) {
    console.log("❌ Error dashboard mahasiswa:", err);
    res.send("Gagal memuat dashboard.");
  }
});

// ================================
// 🧾 Riwayat Presensi + FILTER
// ================================
router.get("/history", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    const student = await prisma.student.findUnique({
      where: { nim: req.user.nim },
    });

    const { startDate, endDate, subjectCode } = req.query;

    // 🔽 Filter dinamis
    const where = { studentNim: student.nim };

    if (startDate && endDate) {
      where.attendanceTime = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59"),
      };
    }

    if (subjectCode && subjectCode !== "all") {
      where.subjectCode = subjectCode;
    }

    // Ambil semua subject untuk dropdown
    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
    });

    // 🔥 Ambil data absensi tanpa include (INI PENTING)
    const historyData = await prisma.attendance.findMany({
      where,
      orderBy: { attendanceTime: "desc" },
    });

    // Format agar cocok dengan EJS
    const history = historyData.map((h) => ({
      subjectName: h.subjectName,
      date: h.attendanceTime,
      attendanceTime: h.attendanceTime,
      status: h.status,
    }));

    const setting = await prisma.setting.findFirst();

    res.render("mahasiswa-history", {
      user: req.user,
      student,
      history,
      setting,
      subjects,
      startDate: startDate || "",
      endDate: endDate || "",
      selectedSubject: subjectCode || "all",
    });

  } catch (err) {
    console.log("❌ Error riwayat mahasiswa:", err);
    res.send("Gagal memuat riwayat.");
  }
});

// ================================
// 📲 Scan QR (tanpa login)
// ================================
router.get("/scan/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { subject: true, Lecturer: true },
  });

  if (!session || !session.isActive) {
    return res.send("❌ QR tidak valid atau sesi sudah selesai.");
  }

  return res.render("scan", { session });
});

// ================================
// 📌 Proses Absen
// ================================
router.post("/scan", async (req, res) => {
  try {
    const { sessionId, nim } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { subject: true, Lecturer: true },
    });

    if (!session || !session.isActive) {
      return res.send("❌ Sesi tidak valid.");
    }

    const student = await prisma.student.findUnique({ where: { nim } });
    if (!student) return res.send("❌ NIM tidak ditemukan.");

    const existing = await prisma.attendance.findFirst({
      where: { studentNim: nim, sessionId },
    });

    if (existing) return res.send("✅ Kamu sudah absen.");

    await prisma.attendance.create({
      data: {
        studentNim: student.nim,
        studentName: student.name,
        class: student.class,
        sessionId,
        subjectCode: session.subjectCode,
        subjectName: session.subject.name,
        lecturerName: session.Lecturer?.name || session.lecturerName,
        date: new Date(),
        status: "Hadir",
      },
    });

    res.send("✅ Absensi berhasil!");
  } catch (err) {
    console.log("❌ Error absensi:", err);
    res.send("❌ Gagal absen.");
  }
});

router.get("/scan-info", verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    res.render("mahasiswa/scan");

  } catch (err) {
    console.log("❌ Error scan info:", err);
    res.send("Gagal memuat scan info");
  }
});

export default router;
