import { Router } from "express";
import {
    loginUser,
    registerUser,
    logoutUser,
    reCreateAccessToken,
    updateUser
} from '../controllers/user.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", auth.verifyJWT, auth.isUser, logoutUser);
router.post("/recreateAccessToken", auth.verifyJWT, auth.isUser, reCreateAccessToken);
router.put("/update", auth.verifyJWT, auth.isUser, updateUser);

export default router;