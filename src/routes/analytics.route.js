import Router from 'express';
import {
    totalAnalytics,
    recentOrders,
    getMonthlySalesOverview,
    salesByCategory
} from '../controllers/analytics.controller.js';
import { auth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get("/totalAnalytics", auth.verifyJWT, auth.isAdmin, totalAnalytics);
router.get("/recentOrders", auth.verifyJWT, auth.isAdmin, recentOrders);
router.get("/getMonthlySalesOverview", auth.verifyJWT, auth.isAdmin, getMonthlySalesOverview);
router.get("/salesByCategory", auth.verifyJWT, auth.isAdmin, salesByCategory);

export default router;