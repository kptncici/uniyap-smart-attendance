import express from "express";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/authMiddleware.js";

const prisma = new PrismaClient();
const router = express.Router();

// ================================
// ✅ HALAMAN SCANNER QR
// ================================
router.get("/", verifyToken, async (req, res) => {

  try {

    // hanya mahasiswa
    if (!req.user || req.user.role !== "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    // ambil data mahasiswa login
    const student = await prisma.student.findUnique({
      where: {
        nim: req.user.nim
      },

      select: {
        nim: true,
        name: true,
        class: true
      }
    });

    if (!student) {
      return res.send("❌ Data mahasiswa tidak ditemukan.");
    }

    // render scanner
    res.render("mahasiswa/scan", {
      student
    });

  } catch (err) {

    console.log("❌ Error scanner:", err);

    res.send("❌ Gagal membuka scanner.");

  }

});

// ================================
// ✅ SESSION QR VALIDATION
// ================================
router.get("/:sessionId", verifyToken, async (req, res) => {

  try {

    // hanya mahasiswa
    if (!req.user || req.user.role !== "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    const { sessionId } = req.params;

    // cari session aktif
    const session = await prisma.session.findUnique({

      where: {
        id: sessionId
      },

      include: {
        subject: true
      }

    });

    // validasi session
    if (!session || !session.isActive) {
      return res.send("❌ QR tidak valid atau sesi sudah ditutup.");
    }

    // ambil mahasiswa login
    const student = await prisma.student.findUnique({

      where: {
        nim: req.user.nim
      },

      select: {
        nim: true,
        name: true,
        class: true
      }

    });

    if (!student) {
      return res.send("❌ Data mahasiswa tidak ditemukan.");
    }

    // cek apakah sudah absen
    const already = await prisma.attendance.findFirst({

      where: {
        sessionId,
        studentNim: student.nim
      }

    });

    // sudah absen
    if (already) {

      return res.render("mahasiswa/success", {
        name: student.name,
        subject: session.subject.name,
        already: true
      });

    }

    // ================================
    // ✅ SIMPAN ABSENSI OTOMATIS
    // ================================
    await prisma.attendance.create({

      data: {

        studentNim: student.nim,
        studentName: student.name,
        class: student.class,

        subjectCode: session.subjectCode,
        subjectName: session.subject.name,

        lecturerName: session.subject.lecturerName,

        sessionId,

        date: new Date(),

        status: "Hadir"

      }

    });

    console.log(`✅ Absensi berhasil → ${student.name}`);

    // sukses
    res.render("mahasiswa/success", {

      name: student.name,
      subject: session.subject.name,
      already: false

    });

  } catch (err) {

    console.log("❌ Error scan session:", err);

    res.send("❌ Gagal proses absensi.");

  }

});

export default router;