// ===============================
// 📘 ADMIN CONTROLLER (FINAL FIXED + LOGGING + SAFE HANDLER)
// ===============================

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ===============================
// 📊 DASHBOARD STATISTIK
// ===============================
export const stats = async (req, res) => {
  try {
    const lecturers = await prisma.lecturer.count();
    const students = await prisma.student.count();
    const subjects = await prisma.subject.count();

    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    const attendance = await prisma.attendance.count({
      where: { attendanceTime: { gte: start, lte: end } },
    });

    console.log("📈 Statistik dashboard dikirim.");
    res.json({ lecturers, students, subjects, attendance });
  } catch (err) {
    console.error("❌ Gagal ambil stats:", err);
    res.status(500).json({ error: "Gagal ambil data statistik" });
  }
};

// ===============================
// 🏫 CRUD DOSEN
// ===============================
export const listLecturers = async (req, res) => {
  try {
    const data = await prisma.lecturer.findMany();
    console.log("📚 Menampilkan daftar dosen:", data.length);
    res.json(data);
  } catch (err) {
    console.error("❌ Gagal ambil data dosen:", err);
    res.status(500).json({ error: "Gagal mengambil data dosen" });
  }
};

export const createLecturer = async (req, res) => {
  try {
    const { nip, name, email } = req.body;
    const item = await prisma.lecturer.create({ data: { nip, name, email } });
    console.log("✅ Dosen ditambahkan:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal tambah dosen:", err);
    res.status(500).json({ error: "Gagal menambah dosen" });
  }
};

export const updateLecturer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status } = req.body;
    const item = await prisma.lecturer.update({
      where: { id },
      data: { name, email, status },
    });
    console.log("✅ Dosen diperbarui:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal update dosen:", err);
    res.status(500).json({ error: "Gagal memperbarui data dosen" });
  }
};

export const deleteLecturer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lecturer.delete({ where: { id } });
    console.log("🗑️ Dosen dihapus:", id);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Gagal hapus dosen:", err);
    res.status(500).json({ error: "Gagal menghapus dosen" });
  }
};

// ===============================
// 🎓 CRUD MAHASISWA
// ===============================
export const listStudents = async (req, res) => {
  try {
    const data = await prisma.student.findMany();
    console.log("📚 Menampilkan daftar mahasiswa:", data.length);
    res.json(data);
  } catch (err) {
    console.error("❌ Gagal ambil data mahasiswa:", err);
    res.status(500).json({ error: "Gagal mengambil data mahasiswa" });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { nim, name, class: cls } = req.body;
    const item = await prisma.student.create({ data: { nim, name, class: cls } });
    console.log("✅ Mahasiswa ditambahkan:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal tambah mahasiswa:", err);
    res.status(500).json({ error: "Gagal menambah mahasiswa" });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { nim, name, class: cls, status } = req.body;
    const item = await prisma.student.update({
      where: { id },
      data: { nim, name, class: cls, status },
    });
    console.log("✅ Mahasiswa diperbarui:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal update mahasiswa:", err);
    res.status(500).json({ error: "Gagal memperbarui mahasiswa" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({ where: { id } });
    console.log("🗑️ Mahasiswa dihapus:", id);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Gagal hapus mahasiswa:", err);
    res.status(500).json({ error: "Gagal menghapus mahasiswa" });
  }
};

// ===============================
// 📘 CRUD MATA KULIAH
// ===============================
export const listSubjects = async (req, res) => {
  try {
    const data = await prisma.subject.findMany();
    console.log("📚 Menampilkan daftar matkul:", data.length);
    res.json(data);
  } catch (err) {
    console.error("❌ Gagal ambil data matkul:", err);
    res.status(500).json({ error: "Gagal mengambil data matkul" });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { code, name, lecturerNip, lecturerName } = req.body;
    const item = await prisma.subject.create({
      data: { code, name, lecturerNip, lecturerName },
    });
    console.log("✅ Matkul ditambahkan:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal tambah matkul:", err);
    res.status(500).json({ error: "Gagal menambah matkul" });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, lecturerNip, lecturerName } = req.body;
    const item = await prisma.subject.update({
      where: { id },
      data: { code, name, lecturerNip, lecturerName },
    });
    console.log("✅ Matkul diperbarui:", name);
    res.json(item);
  } catch (err) {
    console.error("❌ Gagal update matkul:", err);
    res.status(500).json({ error: "Gagal memperbarui matkul" });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    console.log("🗑️ Matkul dihapus:", id);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Gagal hapus matkul:", err);
    res.status(500).json({ error: "Gagal menghapus matkul" });
  }
};
