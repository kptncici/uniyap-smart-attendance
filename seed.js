import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding database awal Sistem Absensi QR...");

  // ===== 1️⃣ ADMIN DEFAULT =====
  const adminPwd = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@uniyap.ac.id" },
    update: {},
    create: {
      name: "Admin Sistem",
      email: "admin@uniyap.ac.id",
      password: adminPwd,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin dibuat → admin@uniyap.ac.id / admin123");

  // ===== 2️⃣ DOSEN DEFAULT =====
  const dosen = await prisma.lecturer.upsert({
    where: { nip: "198501012010011001" },
    update: {},
    create: {
      nip: "198501012010011001",
      name: "Dr. Ahmad Santoso",
      email: "ahmad.santoso@uniyap.ac.id",
      status: "Aktif",
    },
  });

  const dosenPwd = await bcrypt.hash("dosen123", 10);
  await prisma.user.upsert({
    where: { email: dosen.email },
    update: {},
    create: {
      name: dosen.name,
      email: dosen.email,
      password: dosenPwd,
      role: "LECTURER",
      lecturerId: dosen.id,
    },
  });
  console.log("✅ Dosen dibuat → ahmad.santoso@uniyap.ac.id / dosen123");

  // ===== 3️⃣ MAHASISWA DEFAULT =====
  const mahasiswa = await prisma.student.upsert({
    where: { nim: "210001" },
    update: {},
    create: {
      nim: "210001",
      name: "Budi Pratama",
      class: "SI-4A",
      status: "Aktif",
    },
  });

  const mhsPwd = await bcrypt.hash("mahasiswa123", 10);
  await prisma.user.upsert({
    where: { email: "210001@uniyap.ac.id" },
    update: {},
    create: {
      name: mahasiswa.name,
      email: "210001@uniyap.ac.id",
      password: mhsPwd,
      role: "STUDENT",
      studentId: mahasiswa.id,
    },
  });
  console.log("✅ Mahasiswa dibuat → 210001@uniyap.ac.id / mahasiswa123");

  // ===== 4️⃣ MATA KULIAH DEFAULT =====
  await prisma.subject.upsert({
    where: { code: "SI101" },
    update: {},
    create: {
      code: "SI101",
      name: "Pengantar Sistem Informasi",
      lecturerNip: dosen.nip,
      lecturerName: dosen.name,
    },
  });
  console.log("✅ Matkul dibuat → SI101 - Pengantar Sistem Informasi");

  console.log("🎉 SEEDING BERHASIL!");
}

main()
  .then(async () => await prisma.$disconnect())
  .catch(async (err) => {
    console.error("❌ Gagal seeding:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
