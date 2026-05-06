// ===============================
// 📘 SISTEM ABSENSI QR UNIYAP
// File: src/routes/adminRoutes.js (FINAL FIXED + FULL CRUD + SETTINGS + LOGO UPLOAD + SOCKET.IO)
// ===============================

import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { verifyToken } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import { format } from "date-fns";

const prisma = new PrismaClient();
const router = express.Router();

// ===============================
// 🧭 DEBUG LOG SEMUA REQUEST ADMIN
// ===============================
router.use((req, res, next) => {
  console.log(`➡️ [ADMIN ROUTES] ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length > 0) console.log("📦 Body:", req.body);
  next();
});

// ===============================
// 🧩 Middleware: hanya ADMIN
// ===============================
router.use(verifyToken, (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    console.warn("⛔ Akses ditolak: bukan ADMIN");
    return res.redirect("/");
  }
  next();
});

// Helper Redirect
const safeRedirect = (tab, msg = "") =>
  `/dashboard/admin?tab=${tab}${msg ? "&" + msg : ""}`;

// ===============================
// 🏠 DASHBOARD ADMIN
// ===============================
router.get("/", async (req, res) => {
  try {

    console.log("📊 Memuat dashboard admin...");

    const tab = req.query.tab || "grafik";

    const [
      lecturers,
      students,
      subjects,
      attendances
    ] = await Promise.all([

      prisma.lecturer.findMany(),

      prisma.student.findMany(),

      prisma.subject.findMany(),

      prisma.attendance.findMany({
        orderBy: {
          date: "desc"
        }
      })

    ]);

    const [
      totalLecturers,
      totalStudents,
      totalSubjects,
      totalAttendances
    ] = await Promise.all([

      prisma.lecturer.count(),

      prisma.student.count(),

      prisma.subject.count(),

      prisma.attendance.count()

    ]);

    const stats = {
      totalLecturers,
      totalStudents,
      totalSubjects,
      totalAttendances,
    };

    const setting =
      await prisma.setting.findFirst() || {
        systemName: "Sistem Absensi QR UNIYAP",
        slogan: "Digital, Efisien, dan Akurat",
        systemLogo: "/img/logo_kampus.png",
        darkMode: false,
      };

    res.render("dashboard-admin", {

      user: req.user,

      lecturers,
      students,
      subjects,
      attendances,

      stats,
      tab,
      setting,

      start: req.query.start || "",
      end: req.query.end || "",

      success: req.query.success || "",
      error: req.query.error || ""

    });

  } catch (err) {

    console.error("❌ Gagal memuat dashboard admin:", err);

    res.status(500).send("Gagal memuat dashboard admin");

  }
});

// ===============================
// 📊 API STATISTIK DASHBOARD
// ===============================
router.get("/stats/json", async (req, res) => {
  try {
    const [
      totalLecturers,
      totalStudents,
      totalSubjects,
      totalAttendances,
    ] = await Promise.all([
      prisma.lecturer.count(),
      prisma.student.count(),
      prisma.subject.count(),
      prisma.attendance.count(),
    ]);

    // contoh data grafik 7 hari
    const chartData = {
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      values: [12, 19, 8, 15, 20, 10, 14],
    };

    res.json({
      totals: {
        totalLecturers,
        totalStudents,
        totalSubjects,
        totalAttendances,
      },
      chartData,
    });
  } catch (err) {
    console.error("❌ Gagal load statistik:", err);

    res.status(500).json({
      error: "Gagal memuat statistik",
    });
  }
});

// ===============================
// 🏫 CRUD DOSEN
// ===============================
router.post("/lecturer/add", async (req, res) => {
  console.log("🧩 Proses: Tambah Dosen");
  try {
    const { nip, name, email, password } = req.body;

    const exNip = await prisma.lecturer.findUnique({ where: { nip } });
    if (exNip) return res.redirect(safeRedirect("dosen", "error=NIP sudah digunakan"));

    const exEmail = await prisma.lecturer.findUnique({ where: { email } });
    if (exEmail) return res.redirect(safeRedirect("dosen", "error=Email sudah digunakan"));

    const newLecturer = await prisma.lecturer.create({
      data: { nip, name, email, status: "Aktif" },
    });

    const hashed = await bcrypt.hash(password || "123456", 10);
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: "LECTURER",
        lecturerId: newLecturer.id,
      },
    });

    console.log("✅ Dosen berhasil ditambahkan:", name);
    res.redirect(safeRedirect("dosen", "success=Dosen berhasil ditambahkan"));
  } catch (err) {
    console.error("❌ Gagal tambah dosen:", err);
    res.redirect(safeRedirect("dosen", "error=Gagal tambah dosen"));
  }
});

router.post("/lecturer/edit", async (req, res) => {
  console.log("🧩 Proses: Edit Dosen");
  try {
    const { id, nip, name, email, status } = req.body;
    await prisma.lecturer.update({
      where: { id },
      data: { nip, name, email, status },
    });

    await prisma.user.updateMany({
      where: { lecturerId: id },
      data: { name, email },
    });

    console.log("✅ Dosen diperbarui:", name);
    res.redirect(safeRedirect("dosen", "success=Dosen diperbarui"));
  } catch (err) {
    console.error("❌ Gagal edit dosen:", err);
    res.redirect(safeRedirect("dosen", "error=Gagal edit dosen"));
  }
});

router.post("/lecturer/delete", async (req, res) => {
  console.log("🧩 Proses: Hapus Dosen");
  try {
    const { id } = req.body;
    const lecturer = await prisma.lecturer.findUnique({ where: { id } });
    if (!lecturer) return res.redirect(safeRedirect("dosen", "error=Dosen tidak ditemukan"));

    await prisma.session.deleteMany({ where: { lecturerNip: lecturer.nip } });
    await prisma.subject.deleteMany({ where: { lecturerNip: lecturer.nip } });
    await prisma.user.deleteMany({ where: { lecturerId: id } });
    await prisma.lecturer.delete({ where: { id } });

    console.log("✅ Dosen dihapus:", lecturer.name);
    res.redirect(safeRedirect("dosen", "success=Dosen dihapus"));
  } catch (err) {
    console.error("❌ Gagal hapus dosen:", err);
    res.redirect(safeRedirect("dosen", "error=Gagal hapus dosen"));
  }
});

router.post("/lecturer/reset", async (req, res) => {
  console.log("🧩 Proses: Reset Password Dosen");
  try {
    const { id } = req.body;
    const hashed = await bcrypt.hash("123456", 10);
    await prisma.user.updateMany({
      where: { lecturerId: id },
      data: { password: hashed },
    });
    console.log("✅ Password dosen direset ke 123456");
    res.redirect(safeRedirect("dosen", "success=Password dosen direset ke 123456"));
  } catch (err) {
    console.error("❌ Gagal reset password dosen:", err);
    res.redirect(safeRedirect("dosen", "error=Gagal reset password dosen"));
  }
});

// ===============================
// 🎓 CRUD MAHASISWA
// ===============================
router.post("/student/add", async (req, res) => {
  console.log("🧩 Proses: Tambah Mahasiswa");
  try {
    const { nim, name, class: kelas, status } = req.body;
    const exists = await prisma.student.findUnique({ where: { nim } });
    if (exists) return res.redirect(safeRedirect("mahasiswa", "error=NIM sudah digunakan"));

    const student = await prisma.student.create({
      data: { nim, name, class: kelas, status: status || "Aktif" },
    });

    const hashed = await bcrypt.hash("123456", 10);
    await prisma.user.create({
      data: {
        email: nim,
        password: hashed,
        name,
        role: "STUDENT",
        studentId: student.id,
      },
    });

    console.log("✅ Mahasiswa ditambahkan:", name);
    res.redirect(safeRedirect("mahasiswa", "success=Mahasiswa ditambahkan"));
  } catch (err) {
    console.error("❌ Gagal tambah mahasiswa:", err);
    res.redirect(safeRedirect("mahasiswa", "error=Gagal tambah mahasiswa"));
  }
});

router.post("/student/edit", async (req, res) => {
  console.log("🧩 Proses: Edit Mahasiswa");
  try {
    const { id, nim, name, class: kelas, status } = req.body;
    await prisma.student.update({
      where: { id },
      data: { nim, name, class: kelas, status },
    });

    await prisma.user.updateMany({
      where: { studentId: id },
      data: { email: nim, name },
    });

    console.log("✅ Mahasiswa diperbarui:", name);
    res.redirect(safeRedirect("mahasiswa", "success=Mahasiswa diperbarui"));
  } catch (err) {
    console.error("❌ Gagal edit mahasiswa:", err);
    res.redirect(safeRedirect("mahasiswa", "error=Gagal edit mahasiswa"));
  }
});

router.post("/student/delete", async (req, res) => {
  console.log("🧩 Proses: Hapus Mahasiswa");
  try {
    const { id } = req.body;
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return res.redirect(safeRedirect("mahasiswa", "error=Mahasiswa tidak ditemukan"));

    await prisma.attendance.deleteMany({ where: { studentNim: student.nim } });
    await prisma.user.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });

    console.log("✅ Mahasiswa dihapus:", student.name);
    res.redirect(safeRedirect("mahasiswa", "success=Mahasiswa dihapus"));
  } catch (err) {
    console.error("❌ Gagal hapus mahasiswa:", err);
    res.redirect(safeRedirect("mahasiswa", "error=Gagal hapus mahasiswa"));
  }
});

router.post("/student/reset", async (req, res) => {
  console.log("🧩 Proses: Reset Password Mahasiswa");
  try {
    const { id } = req.body;
    const hashed = await bcrypt.hash("123456", 10);
    await prisma.user.updateMany({
      where: { studentId: id },
      data: { password: hashed },
    });
    console.log("✅ Password mahasiswa direset ke 123456");
    res.redirect(safeRedirect("mahasiswa", "success=Password mahasiswa direset"));
  } catch (err) {
    console.error("❌ Gagal reset password mahasiswa:", err);
    res.redirect(safeRedirect("mahasiswa", "error=Gagal reset password mahasiswa"));
  }
});

// ===============================
// 📘 CRUD MATA KULIAH
// ===============================
router.post("/subject/add", async (req, res) => {
  console.log("🧩 Proses: Tambah Matkul");
  try {
    const { code, name, lecturerNip } = req.body;
    const exists = await prisma.subject.findUnique({ where: { code } });
    if (exists) return res.redirect(safeRedirect("matkul", "error=Kode matkul sudah ada"));

    const lecturer = await prisma.lecturer.findUnique({ where: { nip: lecturerNip } });
    await prisma.subject.create({
      data: {
        code,
        name,
        lecturerNip,
        lecturerName: lecturer ? lecturer.name : "-",
      },
    });

    console.log("✅ Matkul ditambahkan:", name);
    res.redirect(safeRedirect("matkul", "success=Matkul ditambahkan"));
  } catch (err) {
    console.error("❌ Gagal tambah matkul:", err);
    res.redirect(safeRedirect("matkul", "error=Gagal tambah matkul"));
  }
});

router.post("/subject/edit", async (req, res) => {
  console.log("🧩 Proses: Edit Matkul");
  try {
    const { id, name, lecturerNip } = req.body;
    const lecturer = await prisma.lecturer.findUnique({ where: { nip: lecturerNip } });
    await prisma.subject.update({
      where: { id },
      data: { name, lecturerNip, lecturerName: lecturer ? lecturer.name : "-" },
    });
    console.log("✅ Matkul diperbarui:", name);
    res.redirect(safeRedirect("matkul", "success=Matkul diperbarui"));
  } catch (err) {
    console.error("❌ Gagal edit matkul:", err);
    res.redirect(safeRedirect("matkul", "error=Gagal edit matkul"));
  }
});

router.post("/subject/delete", async (req, res) => {
  console.log("🧩 Proses: Hapus Matkul");
  try {
    const { id } = req.body;
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) return res.redirect(safeRedirect("matkul", "error=Matkul tidak ditemukan"));

    await prisma.session.deleteMany({ where: { subjectCode: subject.code } });
    await prisma.subject.delete({ where: { id } });

    console.log("✅ Matkul dihapus:", subject.name);
    res.redirect(safeRedirect("matkul", "success=Matkul dihapus"));
  } catch (err) {
    console.error("❌ Gagal hapus matkul:", err);
    res.redirect(safeRedirect("matkul", "error=Gagal hapus matkul"));
  }
});

// ===============================
// ⚙️ UPDATE PENGATURAN AKUN ADMIN
// ===============================
router.post("/settings/update", async (req, res) => {
  console.log("🧩 Proses: Update Pengaturan Akun Admin");
  try {
    const { name, email, password } = req.body;
    const adminId = req.user.id;

    const updateData = { name, email };
    if (password && password.trim() !== "") {
      const hashed = await bcrypt.hash(password, 10);
      updateData.password = hashed;
    }

    await prisma.user.update({
      where: { id: adminId },
      data: updateData,
    });

    console.log("✅ Pengaturan akun admin berhasil diperbarui.");
    res.redirect("/dashboard/admin?tab=settings&success=Pengaturan%20akun%20berhasil%20diperbarui");
  } catch (err) {
    console.error("❌ Gagal update pengaturan akun:", err);
    res.redirect("/dashboard/admin?tab=settings&error=Gagal%20memperbarui%20akun");
  }
});

// ===============================
// ⚙️ UPDATE PENGATURAN SISTEM + LOGO
// ===============================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("public", "img");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/settings/system/update", upload.single("systemLogo"), async (req, res) => {
  console.log("🧩 Proses: Update Pengaturan Sistem");
  try {
    const { systemName, slogan, darkMode } = req.body;
    const logoPath = req.file ? `/img/${req.file.filename}` : null;

    const existing = await prisma.setting.findFirst();

    if (existing) {
      // Hapus logo lama jika diganti
      if (logoPath && existing.systemLogo && fs.existsSync(`public${existing.systemLogo}`)) {
        fs.unlinkSync(`public${existing.systemLogo}`);
      }

      await prisma.setting.update({
        where: { id: existing.id },
        data: {
          systemName,
          slogan,
          darkMode: darkMode === "on",
          ...(logoPath && { systemLogo: logoPath }),
        },
      });
    } else {
      await prisma.setting.create({
        data: {
          systemName,
          slogan,
          darkMode: darkMode === "on",
          systemLogo: logoPath || "/img/logo_kampus.png",
        },
      });
    }

    // 🔔 Emit ke semua client
    const io = req.app.get("io");
    io.emit("settingUpdated", {
      systemName,
      slogan,
      darkMode: darkMode === "on",
      systemLogo: logoPath,
    });

    console.log("✅ Pengaturan sistem berhasil diperbarui!");
    res.redirect("/dashboard/admin?tab=settings&success=Pengaturan%20sistem%20berhasil%20diperbarui");
  } catch (err) {
    console.error("❌ Gagal update sistem:", err);
    res.redirect("/dashboard/admin?tab=settings&error=Gagal%20memperbarui%20pengaturan%20sistem");
  }
});

// =======================================================
// 📅 LAPORAN ABSENSI (FILTER + SEARCH NAMA)
// =======================================================
router.get("/report", async (req, res) => {

  console.log("📋 Memuat laporan absensi...");

  try {

    const {
      start,
      end,
      search
    } = req.query;

    const where = {};

    // FILTER TANGGAL
    if (start && end) {

      where.date = {
        gte: new Date(start + "T00:00:00"),
        lte: new Date(end + "T23:59:59"),
      };

    }

    // SEARCH NAMA MAHASISWA
    if (search && search.trim() !== "") {

      where.studentName = {
        contains: search,
      };

    }

    const [
      lecturers,
      students,
      subjects,
      attendances
    ] = await Promise.all([

      prisma.lecturer.findMany(),

      prisma.student.findMany(),

      prisma.subject.findMany(),

      prisma.attendance.findMany({
        where,
        orderBy: {
          date: "desc"
        }
      })

    ]);

    const [
      totalLecturers,
      totalStudents,
      totalSubjects,
      totalAttendances
    ] = await Promise.all([

      prisma.lecturer.count(),

      prisma.student.count(),

      prisma.subject.count(),

      prisma.attendance.count()

    ]);

    const stats = {
      totalLecturers,
      totalStudents,
      totalSubjects,
      totalAttendances,
    };

    const setting =
      await prisma.setting.findFirst() || {
        systemName: "Sistem Absensi QR UNIYAP",
        slogan: "Digital, Efisien, dan Akurat",
        systemLogo: "/img/logo_kampus.png",
        darkMode: false,
      };

    res.render("dashboard-admin", {

      user: req.user,

      lecturers,
      students,
      subjects,
      attendances,

      stats,
      tab: "report",
      setting,

      start,
      end,
      search,

      success: req.query.success || "",
      error: req.query.error || ""

    });

  } catch (err) {

    console.error("❌ Gagal memuat laporan absensi:", err);

    res.status(500).send(
      "Gagal memuat laporan kehadiran."
    );

  }

});

// =======================================================
// 📤 EXPORT LAPORAN ABSENSI FINAL
// =======================================================
router.get("/report/export", async (req, res) => {

  console.log("🧩 Export laporan absensi...");

  try {

    const {
      start,
      end,
      search
    } = req.query;

    const where = {};

    // =========================
    // FILTER TANGGAL
    // =========================
    if (start && end) {

      where.date = {
        gte: new Date(start + "T00:00:00"),
        lte: new Date(end + "T23:59:59"),
      };

    }

    // =========================
    // SEARCH NAMA
    // =========================
    if (search && search.trim() !== "") {

      where.studentName = {
        contains: search
      };

    }

    // =========================
    // AMBIL DATA ABSENSI
    // =========================
    const attendances =
      await prisma.attendance.findMany({

        where,

        orderBy: {
          date: "desc"
        }

      });

    // =========================
    // JIKA DATA KOSONG
    // =========================
    if (!attendances.length) {

      return res.redirect(
        "/dashboard/admin?tab=report&error=Data laporan kosong"
      );

    }

    // =========================
    // BUAT EXCEL
    // =========================
    const workbook =
      new ExcelJS.Workbook();

    const worksheet =
      workbook.addWorksheet(
        "Laporan Absensi"
      );

    // =========================
    // HEADER KOLOM
    // =========================
    worksheet.columns = [

      {
        header: "No",
        key: "no",
        width: 8
      },

      {
        header: "Nama Mahasiswa",
        key: "studentName",
        width: 35
      },

      {
        header: "Mata Kuliah",
        key: "subjectName",
        width: 35
      },

      {
        header: "Tanggal",
        key: "date",
        width: 25
      },

      {
        header: "Status",
        key: "status",
        width: 15
      }

    ];

    // =========================
    // MASUKKAN DATA
    // =========================
    attendances.forEach((a, index) => {

      worksheet.addRow({

        no: index + 1,

        studentName:
          a.studentName || "-",

        subjectName:
          a.subjectName || "-",

        date:
          new Date(a.date)
          .toLocaleDateString(
            "id-ID",
            {
              day: "2-digit",
              month: "long",
              year: "numeric"
            }
          ),

        status:
          a.status || "Hadir"

      });

    });

    // =========================
    // STYLE HEADER
    // =========================
    worksheet.getRow(1).eachCell((cell) => {

      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF"
        }
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "00B14F"
        }
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "center"
      };

    });

    // =========================
    // BORDER TABLE
    // =========================
    worksheet.eachRow((row) => {

      row.eachCell((cell) => {

        cell.border = {

          top: {
            style: "thin"
          },

          left: {
            style: "thin"
          },

          bottom: {
            style: "thin"
          },

          right: {
            style: "thin"
          }

        };

      });

    });

    // =========================
    // DOWNLOAD FILE
    // =========================
    const filename =
      `Laporan_Absensi_${Date.now()}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${filename}`
    );

    await workbook.xlsx.write(res);

    res.end();

    console.log(
      `✅ Export berhasil (${attendances.length} data)`
    );

  } catch (err) {

    console.error(
      "❌ Export error:",
      err
    );

    res.redirect(
      "/dashboard/admin?tab=report&error=Gagal export laporan"
    );

  }

});

export default router;

