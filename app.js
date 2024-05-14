import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";

import AppError from "./utils/appError.js"; 
import userRouter from "./routes/userRouter.js";

const app = express();

app.use(cookieParser());
app.use(express.json());

// user route
app.use("/api/v1/user", userRouter);

// book route
// app.use("/api/v1/book");

app.all("*", (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

export default app;
