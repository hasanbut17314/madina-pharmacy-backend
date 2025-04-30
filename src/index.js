import dotenv from "dotenv";
import app from "./app.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import connectDB from './db/index.js'

dotenv.config({
    path: './.env'
})

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port: ${process.env.PORT}`);
        })
    })
    .catch((error) => {
        console.log("DB connection failed! ", error);
    })

app.get("/", (_, res) => {
    res.send("Hello World!");
})

// const createAdminUser = async () => {
//     const adminUser = await User.create({
//         firstName: "Admin",
//         lastName: "User",
//         email: "admin@mail.com",
//         password: "admin123",
//         role: "admin",
//         isVerified: true
//     })
//     console.log("Admin user created: ", adminUser);

// }

app.use(errorHandler)