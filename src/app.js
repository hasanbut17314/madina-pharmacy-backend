import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true, limit: "2mb" }))
app.use(express.static("public"))
app.use(cookieParser())

// import API routes
import userRouter from "./routes/user.route.js";
import productRouter from "./routes/product.route.js";
import categoryRouter from "./routes/category.route.js";
import cartRouter from "./routes/cart.route.js";

app.use("/api/user", userRouter)
app.use("/api/product", productRouter)
app.use("/api/category", categoryRouter)
app.use("/api/cart", cartRouter)

export default app