import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import AppError from "./utils/appError.js";
import userRouter from "./routes/userRouter.js";
import bookRouter from "./routes/bookRouter.js";

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
};

app.use(cors(corsOptions));
// app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());

// user route
app.use("/api/v1/user", userRouter);

// book route
app.use("/api/v1/book", bookRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

export default app;
