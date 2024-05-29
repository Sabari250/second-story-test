import express from "express";
import { protect } from "../controllers/userController.js";
import {
  addBook,
  removeBook,
  updateBook,
  getAllBook,
  getBookById,
} from "../controllers/bookController.js";

const router = express.Router();

router.post("/addBook", protect, addBook);
router.post("/removeBook/:id", protect, removeBook);
router.patch("/updateBook/:id", protect, updateBook);

router.get("/getAllBook", getAllBook);
router.post("/getBookById/:id", getBookById);

export default router;
