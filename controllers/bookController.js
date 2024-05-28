import express from "express";
import Book from "../models/bookModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";

const addBook = catchAsync(async (req, res, next) => {
  const {
    title,
    author,
    description,
    price,
    image,
    genres,
    condition,
    category,
  } = req.body;

  // Ensure title and mainTitle are provided and not null
  if (!title || !title.mainTitle) {
    return next(new AppError('Please provide the main title of the book', 400));
  }

  const newBook = await Book.create({
    title,
    author,
    description,
    price,
    image,
    genres,
    condition,
    category,
  });

  const user = await User.findById(req.user.id);

  if (category === 'sell') {
    user.shelf.keep.push(newBook._id);
  } else if (category === 'buy') {
    user.shelf.buy.push(newBook._id);
  } else {
    user.shelf.keep.push(newBook._id);
  }

  await user.save();

  res.status(201).json({
    status: 'success',
    data: {
      newBook,
    },
  });
});

const removeBook = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const book = await Book.findByIdAndDelete(id);
  if (!book) {
    return next(new AppError("Book not found", 404));
  }
  res.status(204).json({
    status: "success",
    data: null,
  });
});

export { addBook, removeBook };
