import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const createOrder = asyncHandler(async (req, res) => {
    const { address, contactNumber } = req.body;

    if (!address || !contactNumber) {
        throw new ApiError(400, "Address and contact number are required");
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
        throw new ApiError(404, "Cart is empty");
    }

    const orderItems = [];
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of cart.items) {
            const product = await Product.findById(item.prodId).session(session);

            if (!product) {
                throw new ApiError(404, `Product ${item.title} no longer exists`);
            }

            if (product.quantity < item.quantity) {
                throw new ApiError(400, `Not enough stock for ${item.title}. Available: ${product.quantity}`);
            }

            await Product.findByIdAndUpdate(
                product._id,
                { $inc: { quantity: -item.quantity } },
                { session }
            );

            orderItems.push({
                prodId: item.prodId,
                quantity: item.quantity,
                price: item.price
            });
        }

        const orderCount = await Order.countDocuments();
        const order_no = `ORD-${Date.now()}-${orderCount + 1}`;

        const order = await Order.create([{
            userId: req.user._id,
            order_no,
            address,
            contactNumber,
            orderItems,
            status: "Pending"
        }], { session });

        await Cart.findByIdAndDelete(cart._id, { session });

        await session.commitTransaction();

        return res.status(201).json(
            new ApiResponse(
                201,
                order[0],
                "Order placed successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
});

const getOrderById = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID format");
    }

    const order = await Order.findById(orderId)
        .populate("orderItems.prodId", "name image")
        .populate("assignedRider", "firstName lastName email");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (
        order.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin" &&
        req.user.role !== "manager" &&
        (!order.assignedRider || order.assignedRider.toString() !== req.user._id.toString())
    ) {
        throw new ApiError(403, "You don't have permission to view this order");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            order,
            "Order fetched successfully"
        )
    );
});

const getUserOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    const query = { userId: req.user._id };

    if (status && ["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
        query.status = status;
    }

    const orders = await Order.find(query)
        .populate("orderItems.prodId", "name image")
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalOrders
                }
            },
            "Orders fetched successfully"
        )
    );
});

const getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    if (req.user.role !== "admin" && req.user.role !== "manager") {
        throw new ApiError(403, "You don't have permission to access all orders");
    }

    const query = {};

    if (status && ["Pending", "Shipped", "Delivered", "Cancelled"].includes(status)) {
        query.status = status;
    }

    const orders = await Order.find(query)
        .populate("userId", "firstName lastName email")
        .populate("orderItems.prodId", "name image")
        .populate("assignedRider", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalOrders
                }
            },
            "All orders fetched successfully"
        )
    );
});

const getRiderOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;

    if (req.user.role !== "rider" && req.user.role !== "admin") {
        throw new ApiError(403, "You don't have permission to access rider orders");
    }

    const query = { assignedRider: req.user._id };

    if (status && ["Shipped", "Delivered", "Cancelled"].includes(status)) {
        query.status = status;
    } else {
        query.status = { $ne: "Pending" };
    }

    const orders = await Order.find(query)
        .populate("userId", "firstName lastName email")
        .populate("orderItems.prodId", "name image")
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit));

    const totalOrders = await Order.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                orders,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalOrders
                }
            },
            "Rider orders fetched successfully"
        )
    );
});

const assignOrderToRider = asyncHandler(async (req, res) => {
    const { orderId, riderId } = req.body;

    if (!orderId || !riderId) {
        throw new ApiError(400, "Order ID and rider ID are required");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(riderId)) {
        throw new ApiError(400, "Invalid ID format");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== "Pending") {
        throw new ApiError(400, "Only pending orders can be assigned to riders");
    }

    const rider = await User.findById(riderId);
    if (!rider) {
        throw new ApiError(404, "Rider not found");
    }

    if (rider.role !== "rider") {
        throw new ApiError(400, "Selected user is not a rider");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            assignedRider: riderId,
            status: "Shipped"
        },
        { new: true }
    ).populate("assignedRider", "firstName lastName email");

    rider.isActive = false;
    await rider.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedOrder,
            "Order assigned to rider successfully"
        )
    );
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
        throw new ApiError(400, "Order ID and status are required");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID format");
    }

    if (!["Delivered", "Cancelled"].includes(status)) {
        throw new ApiError(400, "Status can only be updated to 'Delivered' or 'Cancelled'");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (
        order.assignedRider?.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        throw new ApiError(403, "Only the assigned rider can update this order status");
    }

    if (order.status !== "Shipped") {
        throw new ApiError(400, "Only shipped orders can be updated");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
    );

    const rider = await User.findById(order.assignedRider);
    rider.isActive = true;
    await rider.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedOrder,
            `Order status updated to ${status}`
        )
    );
});

const cancelOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID format");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (
        order.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        throw new ApiError(403, "You don't have permission to cancel this order");
    }

    if (order.status !== "Pending") {
        throw new ApiError(400, "Only pending orders can be cancelled. Contact support for assistance.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
                item.prodId,
                { $inc: { quantity: item.quantity } },
                { session }
            );
        }

        order.status = "Cancelled";
        await order.save({ session });

        await session.commitTransaction();

        return res.status(200).json(
            new ApiResponse(
                200,
                order,
                "Order cancelled successfully"
            )
        );
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Failed to cancel order");
    } finally {
        session.endSession();
    }
});

const addFeedback = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { feedback } = req.body;

    if (!orderId || !feedback) {
        throw new ApiError(400, "Order ID and feedback are required");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID format");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (
        order.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        throw new ApiError(403, "You don't have permission to add feedback to this order");
    }

    if (order.status !== "Delivered") {
        throw new ApiError(400, "Feedback can only be added to delivered orders");
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { feedback },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedOrder,
            "Feedback added successfully"
        )
    );
});

export {
    createOrder,
    getOrderById,
    getUserOrders,
    getAllOrders,
    getRiderOrders,
    assignOrderToRider,
    updateOrderStatus,
    cancelOrder,
    addFeedback
}