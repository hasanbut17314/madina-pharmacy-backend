import { Router } from "express";
import {
    createOrder,
    getOrderById,
    getUserOrders,
    getAllOrders,
    getRiderOrders,
    assignOrderToRider,
    updateOrderStatus,
    cancelOrder,
    addFeedback
} from "../controllers/order.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create", auth.verifyJWT, createOrder);
router.get("/getUserOrders", auth.verifyJWT, getUserOrders);
router.get("/get/:orderId", auth.verifyJWT, getOrderById);
router.put("/:orderId/cancel", auth.verifyJWT, cancelOrder);
router.get("/getAllorders", auth.verifyJWT, auth.isManager, getAllOrders);
router.post("/assign", auth.verifyJWT, auth.isManager, assignOrderToRider);
router.get("/rider/getOrders", auth.verifyJWT, auth.isRider, getRiderOrders);
router.put("/rider/:orderId/updateStatus", auth.verifyJWT, auth.isRider, updateOrderStatus);
router.put("/addFeedback/:orderId", auth.verifyJWT, addFeedback);

export default router;