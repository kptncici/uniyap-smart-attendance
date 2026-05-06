const prisma = require('../db/prismaClient');
exports.attend = async (req,res)=>{
  const { sessionId } = req.body;
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if(!session) return res.status(400).json({error:'Session not found'});
  const student = await prisma.student.findFirst({ where: { nim: req.user.email } });
  if(!student) return res.status(400).json({error:'Student not found'});
  // prevent duplicate
  const exists = await prisma.attendance.findFirst({ where: { studentNim: student.nim, sessionId } });
  if(exists) return res.status(400).json({error:'Already attended'});
  const att = await prisma.attendance.create({ data: { studentNim: student.nim, studentName: student.name, class: student.class, sessionId, subjectCode: session.subjectCode, subjectName: session.subjectName, lecturerName: session.lecturerName, date: session.date } });
  res.json(att);
};
exports.history = async (req,res)=>{
  const student = await prisma.student.findFirst({ where: { nim: req.user.email } });
  if(!student) return res.status(400).json({error:'Student not found'});
  const items = await prisma.attendance.findMany({ where: { studentNim: student.nim } });
  res.json(items);
};
