// ===============================
// 📘 SISTEM ABSENSI QR UNIYAP
// File: src/routes/authRoutes.js (FINAL FIXED WITH LECTURER NIP TOKEN)
// ===============================

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ===============================
// 🧭 GET LOGIN PAGE
// ===============================
router.get("/login-admin", (req, res) =>
  res.render("login", { role: "ADMIN", error: null, expired: req.query.expired || false })
);

router.get("/login-dosen", (req, res) =>
  res.render("login", { role: "LECTURER", error: null, expired: req.query.expired || false })
);

router.get("/login-mahasiswa", (req, res) =>
  res.render("login-mahasiswa", { error: null })
);

// ===============================
// 🔐 LOGIN ADMIN + DOSEN
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.render("login", { role, error: "Semua field wajib diisi", expired: false });
    }

    let user = null;
    let lecturer = null;

    // ADMIN LOGIN
    if (role === "ADMIN") {
      user = await prisma.user.findFirst({ where: { email, role: "ADMIN" } });
    }

    // LECTURER LOGIN
    else if (role === "LECTURER") {
      lecturer = await prisma.lecturer.findFirst({
        where: { OR: [{ email }, { nip: email }] }
      });

      if (lecturer) {
        user = await prisma.user.findFirst({
          where: { lecturerId: lecturer.id, role: "LECTURER" }
        });
      }
    }

    // Block mahasiswa login di sini
    else if (role === "STUDENT") {
      return res.redirect("/auth/login-mahasiswa");
    }

    if (!user) {
      return res.render("login", { role, error: "Akun tidak ditemukan", expired: false });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render("login", { role, error: "Password salah", expired: false });
    }

    // ✅ SIGN TOKEN (Tambahkan nip utk dosen)
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        nip: lecturer?.nip || null  // ✅ FIX: masuk token!
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 2 * 3600 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    console.log(`✅ Login sukses → [${user.role}] ${user.name}`);

    if (user.role === "ADMIN") return res.redirect("/dashboard/admin");
    if (user.role === "LECTURER") return res.redirect("/dashboard/dosen");

    res.redirect("/");

  } catch (err) {
    console.error("❌ Gagal login:", err);
    res.render("login", { role: "ADMIN", error: "Terjadi kesalahan server", expired: false });
  }
});

// ===============================
// ✅ LOGIN MAHASISWA (NIM ONLY)
// ===============================
router.post("/login-mahasiswa", async (req, res) => {
  try {
    const { nim } = req.body;

    if (!nim) return res.render("login-mahasiswa", { error: "Masukkan NIM" });

    const student = await prisma.student.findUnique({ where: { nim } });

    if (!student) return res.render("login-mahasiswa", { error: "NIM tidak ditemukan" });

    const user = await prisma.user.findFirst({ where: { studentId: student.id, role: "STUDENT" } });

    if (!user) return res.render("login-mahasiswa", { error: "Akun belum dibuat admin" });

    // ✅ Token mahasiswa
    const token = jwt.sign(
      { id: user.id, role: "STUDENT", nim: student.nim, name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 3600 * 1000,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    console.log(`✅ Login Mahasiswa → ${nim}`);

    return res.redirect("/dashboard/mahasiswa");

  } catch (err) {
    console.log("❌ Error login mahasiswa:", err);
    res.render("login-mahasiswa", { error: "Terjadi kesalahan" });
  }
});

// ===============================
// 🚪 LOGOUT
// ===============================
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/?expired=true");
});

export default router;
