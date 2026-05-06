// ===============================
// 📘 SISTEM ABSENSI QR UNIYAP
// File: src/routes/dosenRoutes.js
// ===============================

import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";
import QRCode from "qrcode";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();
const router = express.Router();

// 🌍 BASE URL
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ===============================
// ✅ Middleware khusus dosen
// ===============================
router.use(verifyToken, async (req, res, next) => {
  if (!req.user || req.user.role !== "LECTURER") {
    return res.redirect("/auth/login");
  }

  next();
});

// ===============================
// ✅ Helper ambil data dosen
// ===============================
async function getLecturer(req) {
  return prisma.lecturer.findFirst({
    where: {
      email: req.user.email
    }
  });
}

// ===============================
// ✅ Dashboard Dosen
// ===============================
router.get("/", async (req, res) => {
  try {

    const lecturer = await getLecturer(req);

    const subjects = await prisma.subject.findMany({
      where: {
        lecturerNip: lecturer.nip
      }
    });

    const sessions = await prisma.session.findMany({
      where: {
        lecturerNip: lecturer.nip
      },
      include: {
        subject: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const setting = await prisma.setting.findFirst();

    res.render("dashboard-dosen", {
      user: req.user,
      courses: subjects,
      sessions,
      setting
    });

  } catch (err) {

    console.error("❌ Dashboard error:", err);

    res.redirect("/auth/login");
  }
});

// ===============================
// ✅ Buat Session QR
// ===============================
router.post("/session/create", async (req, res) => {

  try {

    const { subjectCode } = req.body;

    const lecturer = await getLecturer(req);

    let session = await prisma.session.findFirst({
      where: {
        lecturerNip: lecturer.nip,
        subjectCode,
        isActive: true
      }
    });

    // jika belum ada session aktif
    if (!session) {

      session = await prisma.session.create({
        data: {
          lecturerNip: lecturer.nip,
          subjectCode,
          isActive: true
        }
      });

    }

    res.redirect(`/dashboard/dosen/session/qr/${session.id}`);

  } catch (err) {

    console.error("❌ Create session error:", err);

    res.redirect("/dashboard/dosen?error=Gagal%20buat%20session");
  }

});

// ===============================
// ✅ Generate QR
// ===============================
router.get("/session/qr-generate/:id", async (req, res) => {

  try {

    const sessionId = req.params.id;

    const qrUrl = `${BASE_URL}/scan/${sessionId}`;

    const qrBase64 = await QRCode.toDataURL(qrUrl, {
      width: 300,
      margin: 2
    });

    await prisma.session.update({
      where: {
        id: sessionId
      },
      data: {
        qrCode: qrBase64
      }
    });

    res.json({
      qr: qrBase64
    });

  } catch (err) {

    console.error("❌ Generate QR error:", err);

    res.json({
      qr: null
    });

  }

});

// ===============================
// ✅ Halaman QR
// ===============================
router.get("/session/qr/:id", async (req, res) => {

  try {

    const session = await prisma.session.findUnique({
      where: {
        id: req.params.id
      },
      include: {
        subject: true
      }
    });

    if (!session) {
      return res.redirect("/dashboard/dosen");
    }

    const setting = await prisma.setting.findFirst();

    res.render("dosen-qr", {
      user: req.user,
      session,
      setting
    });

  } catch (err) {

    console.error("❌ Load QR error:", err);

    res.redirect("/dashboard/dosen");
  }

});

// ===============================
// ✅ Tutup Session
// ===============================
router.post("/session/close", async (req, res) => {

  try {

    await prisma.session.update({
      where: {
        id: req.body.sessionId
      },
      data: {
        isActive: false,
        closedAt: new Date()
      }
    });

    res.redirect("/dashboard/dosen?success=Sesi%20ditutup");

  } catch (err) {

    console.error("❌ Close session error:", err);

    res.redirect("/dashboard/dosen");

  }

});

// ===============================
// ✅ Pilih laporan mata kuliah
// ===============================
router.get("/report", async (req, res) => {

  const lecturer = await getLecturer(req);

  const subjects = await prisma.subject.findMany({
    where: {
      lecturerNip: lecturer.nip
    }
  });

  const setting = await prisma.setting.findFirst();

  res.render("dosen-report-select", {
    user: req.user,
    subjects,
    setting
  });

});

// ===============================
// ✅ Redirect laporan
// ===============================
router.get("/report/go", (req, res) => {

  res.redirect(`/dashboard/dosen/report/${req.query.subjectId}`);

});

// ===============================
// ✅ Halaman laporan
// ===============================
router.get("/report/:subjectId", async (req, res) => {

  try {

    const { subjectId } = req.params;
    const { start, end } = req.query;

    const lecturer = await getLecturer(req);

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId
      }
    });

    if (!subject || subject.lecturerNip !== lecturer.nip) {
      return res.redirect("/dashboard/dosen?error=Akses%20ditolak");
    }

    // =========================
    // FILTER TANGGAL
    // =========================
    let attendanceFilter = {};

    if (start && end) {

      attendanceFilter = {
        date: {
          gte: new Date(start),
          lte: new Date(
            new Date(end).setHours(23, 59, 59, 999)
          )
        }
      };

    }

    // =========================
    // AMBIL SESSION + ABSENSI
    // =========================
    const sessions = await prisma.session.findMany({

      where: {
        subjectCode: subject.code
      },

      include: {

        attendances: {

          where: attendanceFilter,

          orderBy: {
            date: "desc"
          }

        }

      },

      orderBy: {
        createdAt: "desc"
      }

    });

    const setting = await prisma.setting.findFirst();

    res.render("dosen-report", {

      user: req.user,
      subject,
      sessions,
      setting,

      start: start || "",
      end: end || ""

    });

  } catch (err) {

    console.error("❌ Report error:", err);

    res.redirect("/dashboard/dosen");

  }

});

// ===============================
// ✅ Export Excel
// ===============================
router.get("/report/:subjectId/export", async (req, res) => {

  try {

    const { subjectId } = req.params;
    const { start, end } = req.query;

    const lecturer = await getLecturer(req);

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId
      }
    });

    if (!subject || subject.lecturerNip !== lecturer.nip) {
      return res.redirect("/dashboard/dosen?error=Akses%20ditolak");
    }

    // FILTER TANGGAL
    let dateFilter = {};

    if (start && end) {

      dateFilter = {
        date: {
          gte: new Date(start),
          lte: new Date(end)
        }
      };

    }

    const attendances = await prisma.attendance.findMany({
      where: {
        subjectCode: subject.code,
        ...dateFilter
      },
      orderBy: {
        date: "desc"
      }
    });

    // ===============================
    // ✅ EXCEL
    // ===============================
    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet("Laporan Presensi");

    worksheet.columns = [
      {
        header: "Nama Mahasiswa",
        key: "studentName",
        width: 35
      },
      {
        header: "NIM",
        key: "studentNim",
        width: 18
      },
      {
        header: "Kelas",
        key: "class",
        width: 15
      },
      {
        header: "Tanggal",
        key: "date",
        width: 18
      },
      {
        header: "Jam",
        key: "time",
        width: 15
      },
      {
        header: "Status",
        key: "status",
        width: 15
      }
    ];

    // STYLE HEADER
    worksheet.getRow(1).font = {
      bold: true
    };

    attendances.forEach((a) => {

      worksheet.addRow({
        studentName: a.studentName,
        studentNim: a.studentNim,
        class: a.class,
        date: new Date(a.date).toLocaleDateString("id-ID"),
        time: a.attendanceTime
          ? new Date(a.attendanceTime).toLocaleTimeString("id-ID")
          : "-",
        status: a.status
      });

    });

    const fileName =
      `Laporan-${subject.code}-${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}`
    );

    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {

    console.error("❌ Export error:", err);

    res.redirect(
      `/dashboard/dosen/report/${req.params.subjectId}?error=Export%20gagal`
    );

  }

});

export default router;