import asyncHandler from "../utils/asyncHandler.js"
import ApiResponse from "../utils/ApiResponse.js"
import ApiError from "../utils/ApiError.js"
import { Product } from '../models/product.model.js'
import { uploadOnCloudinary, updateFileOnCloudinary } from "../utils/cloudinary.js"

const addProduct = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        quantity,
        category,
        isActive,
        isFeatured
    } = req.body

    if ([name, price, quantity].some((value) => value.trim() === "")) {
        throw new ApiError(400, "All required fields are not filled")
    }

    let image = null;
    if (req.file) {
        const response = await uploadOnCloudinary(req.file.buffer, req.file.originalname)
        image = response?.secure_url
    }

    const product = await Product.create({
        name,
        price,
        quantity,
        image,
        category,
        isActive,
        isFeatured
    })

    return res.status(201).json(new ApiResponse(201, product, "Product added successfully"))
})

const updateProduct = asyncHandler(async (req, res) => {
    const {
        name,
        price,
        quantity,
        category,
        isActive,
        isFeatured
    } = req.body

    if ([name, price, quantity].some((value) => value.trim() === "")) {
        throw new ApiError(400, "All required fields are not filled")
    }

    const product = await Product.findById(req.params.id)

    if (!product) {
        throw new ApiError(404, "Product not found")
    }

    let image = product.image || null
    if (req.file) {
        const response = await updateFileOnCloudinary(req.file.buffer, req.file.originalname, product.image)
        image = response?.secure_url
    }

    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name,
            price,
            quantity,
            image,
            category,
            isActive: isActive || true,
            isFeatured: isFeatured || false
        },
        {
            new: true
        }
    )

    return res.status(200).json(new ApiResponse(200, updatedProduct, "Product updated successfully"))
})

export {
    addProduct,
    updateProduct
}