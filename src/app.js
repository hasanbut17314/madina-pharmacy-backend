import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { auth } from './middlewares/auth.middleware.js'

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

app.use("/api/user", userRouter)
app.use(auth.verifyJWT)
app.use("/api/product", productRouter)

export default app