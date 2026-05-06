// ===============================
// 📘 SISTEM ABSENSI QR UNIYAP
// File: src/controllers/authController.js (FINAL FIXED)
// ===============================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// ===============================
// 🟢 TAMPILKAN HALAMAN LOGIN
// ===============================
export const showLogin = (req, res) => {
  res.render("login", { error: null });
};

// ===============================
// 🧠 PROSES LOGIN (EMAIL / NIP / NIM)
// ===============================
export const loginUser = async (req, res) => {
  const { email, password } = req.body; // field bisa berisi email, NIP, atau NIM

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    // 🔍 Jika tidak ditemukan, coba cari berdasarkan NIP (dosen)
    if (!user) {
      const lecturer = await prisma.lecturer.findUnique({ where: { nip: email } });
      if (lecturer) {
        user = await prisma.user.findFirst({ where: { lecturerId: lecturer.id } });
      }
    }

    // 🔍 Jika tidak ditemukan, coba cari berdasarkan NIM (mahasiswa)
    if (!user) {
      const student = await prisma.student.findUnique({ where: { nim: email } });
      if (student) {
        user = await prisma.user.findFirst({ where: { studentId: student.id } });
      }
    }

    // ❌ Jika tetap tidak ditemukan
    if (!user) {
      console.warn(`⚠️ Login gagal → Akun tidak ditemukan untuk: ${email}`);
      return res.render("login", { error: "Email / NIP / NIM tidak ditemukan!" });
    }

    // 🔐 Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`⚠️ Login gagal → Password salah untuk: ${user.email || email}`);
      return res.render("login", { error: "Password salah!" });
    }

    // ✅ Jika berhasil, buat JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Simpan token di cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8, // 8 jam
    });

    console.log(`✅ Login sukses → [${user.role}] ${user.name}`);

    // 🚀 Redirect sesuai role
    switch (user.role) {
      case "ADMIN":
        return res.redirect("/dashboard/admin");
      case "LECTURER":
        return res.redirect("/dashboard/dosen");
      case "STUDENT":
        return res.redirect("/dashboard/mahasiswa");
      default:
        return res.redirect("/");
    }
  } catch (err) {
    console.error("❌ Error login:", err);
    res.render("login", { error: "Terjadi kesalahan sistem. Silakan coba lagi." });
  }
};

// ===============================
// 🚪 LOGOUT USER
// ===============================
export const logoutUser = (req, res) => {
  res.clearCookie("token");
  console.log("🚪 User logout berhasil");
  res.redirect("/");
};
