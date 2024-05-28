import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: {
    mainTitle: {
      type: String,
    },
    subTitle: {
      type: String,
    },
  },
  author: {
    type: String,
    required: [true, 'A book must have an author'],
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: [true, 'A book must have a price'],
  },
  image: {
    mainImg: {
      type: String,
    },
    img1: {
      type: String,
    },
    img2: {
      type: String,
    },
  },
  genres: {
    type: String,
    enum: [
      "fiction",
      "non-fiction",
      "biography",
      "children",
      "history",
      "poetry",
      "romance",
      "science-fiction",
      "thriller",
      "travel",
      "other",
    ],
    required: [true, 'A book must have a genre'],
  },
  condition: {
    type: String,
    enum: [
      "new",
      "used",
      "like new",
      "very good",
      "good",
      "acceptable",
      "poor",
    ],
    required: [true, 'A book must have a condition'],
  },
  category: {
    type: String,
    enum: ["sell", "land", "keep"],
    required: [true, 'A book must have a category'],
  },
});

const Book = mongoose.model("Book", bookSchema);

export default Book;
