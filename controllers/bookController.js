import express from "express";
import Book from "../models/bookModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";

const addBook = catchAsync(async (req, res, next) => {
  const { title, author, description, price, images, genres, category } = req.body;

  // Ensure the addedBy field is set to the current user's ID
  const addedBy = req.user.id;

  const newBook = await Book.create({
    title,
    author,
    description,
    price,
    images,
    genres,
    category,
    addedBy
  });

  const user = await User.findById(req.user.id);

  if (category === "sell") {
    user.shelf.sell.push(newBook._id);
  } else if (category === "lend") {
    user.shelf.lend.push(newBook._id);
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
  const { page = 1, limit = 25 } = req.query;

  const startIndex = (page - 1) * limit;

  const books = await Book.find().skip(startIndex).limit(limit);
  const totalDocuments = await Book.countDocuments();

  const totalPages = Math.ceil(totalDocuments / limit);

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

const filterBooks = catchAsync(async (req, res, next) => {
  const filter = req.body;

  // Build the query object based on the filter
  let query = {};

  if (filter.title) {
    if (filter.title.main_title) {
      query["title.main_title"] = filter.title.main_title;
    }
    if (filter.title.sub_title) {
      query["title.sub_title"] = filter.title.sub_title;
    }
  }

  if (filter.author) {
    query.author = filter.author;
  }

  if (filter.price) {
    query.price = filter.price;
  }

  if (filter.genres) {
    query.genres = filter.genres;
  }

  if (filter.category) {
    query.category = filter.category;
  }

  const books = await Book.find(query);

  res.status(200).json({
    status: "success",
    data: {
      books,
    },
  });
});

const searchBook = catchAsync(async (req, res, next) => {
  const query = req.params.q;
  let searchQuery;

  // Check if the query consists of only one word
  if (query.trim().split(/\s+/).length === 1) {
    // If it's a single word, search across all relevant fields
    searchQuery = {
      $or: [
        { "title.main_title": { $regex: query, $options: "i" } },
        { "title.sub_title": { $regex: query, $options: "i" } },
        { author: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { genres: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    };
  } else {
    // If it's not a single word, perform the text search as before
    searchQuery = { $text: { $search: query } };
  }

  const books = await Book.find(searchQuery);

  res.json({
    status: "success",
    data: {
      books,
    },
  });
});

const getBookFromnIventory = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id)
    .populate("shelf.keep shelf.sell shelf.lend")
    .exec();

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  let books;

  if (user.isAdmin) {
    // Fetch only the books added by the admin user
    books = await Book.find({ addedBy: user._id });
  } else {
    return next(new AppError("You are not authorized to access this route", 403));
  }

  res.status(200).json({
    status: "success",
    data: {
      books,
    },
  });
});


export {
  addBook,
  removeBook,
  updateBook,
  getAllBook,
  getBookById,
  filterBooks,
  searchBook,
  getBookFromnIventory,
};
