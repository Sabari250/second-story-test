import express from "express";
import mongoose from "mongoose";
import app from "./app.js";

const DB = process.env.DATABASE;

mongoose
  .connect(DB)
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.log(err);
  });

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
})