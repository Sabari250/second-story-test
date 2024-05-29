import express from "express";
import Book from "../models/bookModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";

const addBook = catchAsync(async (req, res, next) => {
  const { title, author, description, price, images, genres, category } =
    req.body;

  const newBook = await Book.create({
    title,
    author,
    description,
    price,
    images,
    genres,
    category,
  });

  const user = await User.findById(req.user.id);

  if (category === "sell") {
    user.shelf.keep.push(newBook._id);
  } else if (category === "buy") {
    user.shelf.buy.push(newBook._id);
  } else {
    user.shelf.keep.push(newBook._id);
  }

  await user.save({ validateModifiedOnly: true });

  res.status(201).json({
    status: "success",
    data: {
      newBook,
    },
  });
});

const removeBook = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const { id } = req.params;
  const book = await Book.findByIdAndDelete(id);
  if (!book) {
    return next(new AppError("Book not found", 404));
  }

  user.shelf.keep = user.shelf.keep.filter(
    (bookId) => bookId.toString() !== id
  );
  user.shelf.sell = user.shelf.sell.filter(
    (bookId) => bookId.toString() !== id
  );
  user.shelf.land = user.shelf.land.filter(
    (bookId) => bookId.toString() !== id
  );

  await user.save({ validateModifiedOnly: true });

  res.status(204).json({
    status: "success",
    message: "Book removed successfully",
  });
});

const updateBook = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const bookId = req.params.id;

  const currentBook = await Book.findById(bookId);

  if (!currentBook) {
    return next(new AppError("Book not found", 404));
  }

  // Check if the category is being updated
  const newCategory = req.body.category;
  const oldCategory = currentBook.category;

  // Update the book
  const updatedBook = await Book.findByIdAndUpdate(bookId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBook) {
    return next(new AppError("Book not found", 404));
  }

  // Remove the book from the old category shelf if the category has changed
  if (oldCategory !== newCategory) {
    // Remove from old shelf
    user.shelf.keep = user.shelf.keep.filter((id) => id.toString() !== bookId);
    user.shelf.sell = user.shelf.sell.filter((id) => id.toString() !== bookId);
    user.shelf.lend = user.shelf.lend.filter((id) => id.toString() !== bookId);

    // Add to new shelf
    switch (newCategory) {
      case "keep":
        user.shelf.keep.push(bookId);
        break;
      case "sell":
        user.shelf.sell.push(bookId);
        break;
      case "lend":
        user.shelf.lend.push(bookId);
        break;
      default:
        return next(new AppError("Invalid category", 400));
    }

    // Save the updated user
    await user.save({ validateModifiedOnly: true });
  }

  res.status(200).json({
    status: "success",
    data: {
      book: updatedBook,
    },
  });
});

const getAllBook = catchAsync(async (req, res, next) => {
  const books = await Book.find();

  res.status(200).json({
    status: "success",
    data: {
      books,
    },
  });
});

const getBookById = catchAsync(async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book) {
      return res.json(book);
    } else {
      res.status(404);
      throw new Error("Book not found");
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: "Book not found" });
  }
});

const getBookByFilter = catchAsync(async (req, res, next) => {
  const { filter } = req.params;
  const books = await Book.find({ filter });
  res.status(200).json({
    status: "success",
    data: {
      books,
    },
  });
});

export { addBook, removeBook, updateBook, getAllBook, getBookById };
