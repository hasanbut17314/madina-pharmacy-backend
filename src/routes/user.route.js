import { Router } from "express";
import {
    loginUser,
    registerUser,
    logoutUser,
    reCreateAccessToken,
    updateUser,
    addUser,
    getAllUsers,
    verifyEmail
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/register", registerUser);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/login", loginUser);
router.post("/logout", auth.verifyJWT, logoutUser);
router.post("/recreateAccessToken", auth.verifyJWT, reCreateAccessToken);
router.put("/update", auth.verifyJWT, updateUser);
router.post("/addUser", auth.verifyJWT, auth.isAdmin, addUser);
router.get("/getAllUsers", auth.verifyJWT, auth.allowRoles(["admin", "manager"]), getAllUsers);

export default router;