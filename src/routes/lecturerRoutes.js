// ===============================
// 🎓 SISTEM ABSENSI QR UNIYAP
// File: src/routes/lecturerRoutes.js (FINAL STABLE FIXED)
// ===============================

import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";
import QRCode from "qrcode";
import ExcelJS from "exceljs";
import { format } from "date-fns";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

// ===============================
// 🔐 Middleware (Hanya Dosen)
// ===============================
router.use(verifyToken, (req, res, next) => {
  if (!req.user || req.user.role !== "LECTURER") {
    return res.redirect("/");
  }
  next();
});

// ===============================
// 🏠 Dashboard Dosen
// ===============================
router.get("/", async (req, res) => {
  try {
    const lecturer = await prisma.lecturer.findUnique({
      where: { email: req.user.email },
    });

    const subjects = await prisma.subject.findMany({
      where: { lecturerNip: lecturer.nip },
    });

    const sessions = await prisma.session.findMany({
      where: { lecturerNip: lecturer.nip },
      include: { subject: true },
      orderBy: { createdAt: "desc" },
    });

    const setting =
      (await prisma.setting.findFirst()) || {
        systemLogo: "/img/logo.png",
        systemName: "Sistem Absensi UNIYAP",
      };

    res.render("dashboard-dosen", {
      user: req.user,
      subjects,
      sessions,
      setting,
    });

  } catch (err) {
    console.error("❌ Dashboard dosen error:", err);
    res.status(500).send("Gagal memuat dashboard dosen");
  }
});

// ===============================
// ➕ Buat Sesi QR
// ===============================
router.post("/session/create", async (req, res) => {
  try {
    const { subjectCode } = req.body;

    const subject = await prisma.subject.findFirst({
      where: {
        code: subjectCode,
        lecturerNip: req.user.nip,
      },
    });

    if (!subject) {
      return res.redirect("/dashboard/dosen?error=Matakuliah%20tidak%20valid");
    }

    const session = await prisma.session.create({
      data: {
        subjectCode,
        lecturerNip: subject.lecturerNip,
        lecturerName: subject.lecturerName,
        createdAt: new Date(),
        status: "Aktif",
      },
    });

    // Generate QR token + file
    const token = `${session.id}-${Date.now()}`;
    const payload = JSON.stringify({
      sessionId: session.id,
      token,
      lecturerNip: subject.lecturerNip,
      subjectCode,
    });

    const folder = "public/qrcodes";
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);

    const fileName = `${session.id}.png`;
    const filePath = `${folder}/${fileName}`;

    await QRCode.toFile(filePath, payload);

    await prisma.session.update({
      where: { id: session.id },
      data: { qrImage: fileName, qrToken: token },
    });

    const setting =
      (await prisma.setting.findFirst()) || { systemLogo: "/img/logo.png" };

    res.render("dosen-qr", {
      user: req.user,
      session: { ...session, subject, qrCode: `/qrcodes/${fileName}` },
      setting,
    });

  } catch (err) {
    console.error("❌ Gagal buat QR:", err);
    res.redirect("/dashboard/dosen?error=Gagal%20buat%20QR");
  }
});

// ===============================
// 📊 Laporan Absensi Per Matkul
// ===============================
router.get("/report/:code", async (req, res) => {
  try {
    const { code } = req.params;

    const subject = await prisma.subject.findFirst({
      where: { code, lecturerNip: req.user.nip },
    });

    if (!subject)
      return res.redirect("/dashboard/dosen?error=Akses%20ditolak");

    const attendance = await prisma.attendance.findMany({
      where: { subjectCode: code },
      include: { student: true },
      orderBy: { attendanceTime: "desc" },
    });

    const setting = await prisma.setting.findFirst();

    res.render("partials/dosen-report", {
      user: req.user,
      subject,
      attendance,
      setting,
    });

  } catch (err) {
    console.error("❌ Error laporan dosen:", err);
    res.redirect("/dashboard/dosen?error=Gagal%20memuat%20laporan");
  }
});

// ===============================
// 📤 Export Excel
// ===============================
router.get("/report/:code/export", async (req, res) => {
  try {
    const { code } = req.params;

    const subject = await prisma.subject.findFirst({
      where: { code, lecturerNip: req.user.nip },
    });

    const data = await prisma.attendance.findMany({
      where: { subjectCode: code },
      include: { student: true },
    });

    if (!data.length) {
      return res.redirect(
        `/dashboard/dosen/report/${code}?error=Tidak%20ada%20data`
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`Laporan ${subject.name}`);

    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Tanggal", key: "tanggal", width: 20 },
      { header: "Nama", key: "nama", width: 30 },
      { header: "NIM", key: "nim", width: 20 },
      { header: "Status", key: "status", width: 15 },
    ];

    data.forEach((a, i) => {
      sheet.addRow({
        no: i + 1,
        tanggal: format(new Date(a.attendanceTime), "dd/MM/yyyy HH:mm"),
        nama: a.student?.name,
        nim: a.studentNim,
        status: a.status || "Hadir",
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const file = `Laporan_${subject.code}.xlsx`;

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file}"`
    );
    res.send(buffer);

  } catch (err) {
    console.error("❌ Export error:", err);
    res.redirect("/dashboard/dosen?error=Export%20gagal");
  }
});

export default router;
