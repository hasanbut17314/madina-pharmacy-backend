import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

const totalAnalytics = asyncHandler(async (req, res) => {
    // Get total revenue from orders
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$totalPrice" },
                totalOrders: { $sum: 1 }
            },
        },
    ]);

    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get total users count
    const totalUsers = await User.countDocuments();

    const analytics = {
        totalRevenue: totalSales[0]?.totalRevenue || 0,
        totalOrders: totalSales[0]?.totalOrders || 0,
        totalProducts,
        totalUsers
    };

    return res
        .status(200)
        .json(
            new ApiResponse(200, analytics, "Analytics fetched successfully")
        );
});

const recentOrders = asyncHandler(async (req, res) => {
    const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "firstName lastName email")
        .populate("orderItems.prodId", "name image");

    return res.status(200).json(new ApiResponse(200, recentOrders, "Recent orders fetched successfully"));
});

const getMonthlySalesOverview = asyncHandler(async (req, res) => {
    const {
        startDate = new Date(new Date().getFullYear(), 0, 1),
        endDate = new Date(),
        groupBy = 'month'
    } = req.query;

    if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        throw new ApiError(400, 'Invalid date format');
    }

    const salesOverview = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            }
        },
        {
            $group: {
                _id: {
                    ...(groupBy === 'month' ? {
                        month: { $month: '$createdAt' },
                        year: { $year: '$createdAt' }
                    } : {
                        year: { $year: '$createdAt' }
                    })
                },
                totalSales: { $sum: '$totalPrice' },
                totalOrders: { $sum: 1 },
                avgOrderValue: { $avg: '$totalPrice' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                month: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id.month', 1] }, then: 'Jan' },
                            { case: { $eq: ['$_id.month', 2] }, then: 'Feb' },
                            { case: { $eq: ['$_id.month', 3] }, then: 'Mar' },
                            { case: { $eq: ['$_id.month', 4] }, then: 'Apr' },
                            { case: { $eq: ['$_id.month', 5] }, then: 'May' },
                            { case: { $eq: ['$_id.month', 6] }, then: 'Jun' },
                            { case: { $eq: ['$_id.month', 7] }, then: 'Jul' },
                            { case: { $eq: ['$_id.month', 8] }, then: 'Aug' },
                            { case: { $eq: ['$_id.month', 9] }, then: 'Sep' },
                            { case: { $eq: ['$_id.month', 10] }, then: 'Oct' },
                            { case: { $eq: ['$_id.month', 11] }, then: 'Nov' },
                            { case: { $eq: ['$_id.month', 12] }, then: 'Dec' }
                        ],
                        default: 'Unknown'
                    }
                },
                sales: '$totalSales',
                orders: '$totalOrders',
                avgOrderValue: { $round: ['$avgOrderValue', 2] }
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, salesOverview, 'Monthly sales overview retrieved successfully')
    );
});

const salesByCategory = asyncHandler(async (req, res) => {
    const salesByCategory = await Order.aggregate([
        {
            $unwind: "$orderItems"
        },
        {
            $lookup: {
                from: "products",
                localField: "orderItems.prodId",
                foreignField: "_id",
                as: "product"
            }
        },
        {
            $unwind: "$product"
        },
        {
            $lookup: {
                from: "categories",
                localField: "product.category",
                foreignField: "_id",
                as: "category"
            }
        },
        {
            $unwind: "$category"
        },
        {
            $group: {
                _id: "$category.name",
                totalSales: { $sum: "$orderItems.price" }
            }
        },
        {
            $sort: {
                totalSales: -1
            }
        },
        {
            $limit: 5
        }
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            salesByCategory,
            "Sales by category fetched successfully"
        )
    );
})

export { totalAnalytics, recentOrders, getMonthlySalesOverview, salesByCategory };

