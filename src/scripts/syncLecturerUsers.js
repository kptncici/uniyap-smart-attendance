import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function sync() {
  const lecturers = await prisma.lecturer.findMany();

  for (const lec of lecturers) {
    let user = await prisma.user.findFirst({ where: { lecturerId: lec.id } });

    if (!user) {
      console.log("Membuat user untuk:", lec.email);
      await prisma.user.create({
        data: {
          email: lec.email,
          name: lec.name,
          role: "LECTURER",
          lecturerId: lec.id,
          password: await bcrypt.hash("123456", 10)
        }
      });
    }
  }

  console.log("✅ Sync selesai");
  process.exit();
}

sync();
