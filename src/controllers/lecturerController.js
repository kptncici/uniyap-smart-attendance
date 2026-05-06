const prisma = require('../db/prismaClient');
const qr = require('../utils/qrGenerator');
exports.createSession = async (req,res)=>{
  const { subjectCode, date, time, duration } = req.body;
  const subject = await prisma.subject.findFirst({ where: { code: subjectCode } });
  if(!subject) return res.status(400).json({error:'Subject not found'});
  const session = await prisma.session.create({ data: { subjectCode, subjectName: subject.name, lecturerNip: req.user.email||'unknown', lecturerName: req.user.name, date: new Date(date), time, duration } });
  const qrData = JSON.stringify({ sessionId: session.id, subjectCode: session.subjectCode });
  const qrImage = await qr.generateDataUrl(qrData);
  res.json({ session, qrImage });
};
exports.listAttendance = async (req,res)=>{
  const { sessionId } = req.params;
  const items = await prisma.attendance.findMany({ where: { sessionId } });
  res.json(items);
};
