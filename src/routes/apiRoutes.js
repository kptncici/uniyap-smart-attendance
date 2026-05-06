import express from "express";
import * as adminController from "../controllers/adminController.js";
const router = express.Router();

router.get("/stats", adminController.stats);
router.get("/lecturers", adminController.listLecturers);
router.post("/lecturers", adminController.createLecturer);
router.put("/lecturers/:id", adminController.updateLecturer);
router.delete("/lecturers/:id", adminController.deleteLecturer);

router.get("/students", adminController.listStudents);
router.post("/students", adminController.createStudent);
router.put("/students/:id", adminController.updateStudent);
router.delete("/students/:id", adminController.deleteStudent);

router.get("/subjects", adminController.listSubjects);
router.post("/subjects", adminController.createSubject);
router.put("/subjects/:id", adminController.updateSubject);
router.delete("/subjects/:id", adminController.deleteSubject);

export default router;
