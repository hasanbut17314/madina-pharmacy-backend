import { Router } from "express";
import {
    createJob,
    updateJob,
    deleteJob,
    getJobById,
    getAllJobs,
    submitApplication,
    getApplicationById,
    updateApplicationStatus,
    getAllApplications,
    deleteApplication
} from "../controllers/job.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/create", auth.verifyJWT, auth.isAdmin, createJob);
router.put("/update/:id", auth.verifyJWT, auth.isAdmin, updateJob);
router.delete("/delete/:id", auth.verifyJWT, auth.isAdmin, deleteJob);
router.get("/getJobById/:id", getJobById);
router.get("/getAllJobs", getAllJobs);
router.post("/submitApplication", auth.verifyJWT, upload.single("resume"), submitApplication);
router.get("/getApplicationById/:id", getApplicationById);
router.put("/updateApplicationStatus/:id", auth.verifyJWT, auth.isAdmin, updateApplicationStatus);
router.get("/getAllApplications", auth.verifyJWT, auth.isAdmin, getAllApplications);
router.delete("/deleteApplication/:id", auth.verifyJWT, auth.isAdmin, deleteApplication);

export default router;