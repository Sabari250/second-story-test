import express from "express";
import { protect } from "../controllers/userController.js";
import { getAllBook, getBookFromnIventory } from "../controllers/bookController.js";

const router = express.Router();

router.route("/getAllBooks").get(protect, getAllBook);
router.route("/inventoryBook").get(protect, getBookFromnIventory);

export default router;
