import mongoose from "mongoose";
 
const bookSchema = new mongoose.Schema({
  title: {
    type: Object,
    required: true,
    properties: {
      main_title: {
        type: String,
        required: true,
        trim: true,
      },
      sub_title: {
        type: String,
        trim: true,
      },
    },
  },
  author: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: Object,
    required: true,
    properties: {
      main_image: {
        type: String,
        required: true,
      },
      image1: {
        type: String,
        required: true,
      },
      image2: {
        type: String,
        required: true,
      },
    },
  },
  // images: {
  // type: [String],
  // required: true,
  // validate: (images) => images.length >= 3,
  // message:
  //   "Please provide at least 3 images for the book (one main image required).",
  // },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  genres: {
    type: String,
    required: true,
    enum: [
      "Fiction",
      "Non-Fiction",
      "Biography",
      "Science Fiction",
      "Mystery",
      "Thriller",
      "Romance",
      "Self-Help",
      "History",
      "Children",
    ],
  },
  category: {
    type: String,
    required: true,
    enum: ["keep", "lend", "sell"],
  },
  condition: {
    type: String,
    enum: [
      "New",
      "Used",
      "Like New",
      "Very Good",
      "Good",
      "Acceptable",
      "Poor",
    ],
  },
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   required: true
  // }
});
 
const Book = mongoose.model("Book", bookSchema);
 
export default Book;