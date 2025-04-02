import { Router } from "express";
import {
    addProduct,
    updateProduct
} from '../controllers/product.controller.js';
import { auth } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();

router.post("/add", auth.isAdmin, upload.single("image"), addProduct);
router.put("/update/:id", auth.isAdmin, upload.single("image"), updateProduct);

export default router;