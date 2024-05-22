import express from "express";
import book from "../models/bookModel"
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";

const addBook = catchAsync(async (req, res, next) => {
  const newBook = await book.create(req.body);
  res.status(201).json({
    status: "success",
    data: {
      newBook,
    },
  });
});

const removeBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const book = await book.findByIdAndDelete(id);
  if (!book) {
    return next(new AppError("Book not found", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});


export { addBook, removeBook };