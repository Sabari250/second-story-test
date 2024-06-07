import express from "express";
import {
  signup,
  login,
  protect,
  logout,
  forgotPassword,
  passwordReset,
  getCurrentUser,
  updateUserProfile,
  updatePassword,
  addToCart,
  getCart,
  removeFromCart,
  createInvoice,
  getallInvoices,
  getInvoiceById,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", passwordReset);

router
  .route("/profile")
  .get(protect, getCurrentUser)
  .patch(protect, updateUserProfile);

router.route("/updatePassword", protect, updatePassword);

router.route("/cart").post(protect, addToCart).get(protect, getCart);
// .patch(protect, removeFromCart);

router.route("/cart/:bookId").delete(protect, removeFromCart);

router.post("/createinvoice", protect, createInvoice);

router.get("/getallinvoices", protect, getallInvoices);

router.get("/getinvoicebyid/:id", protect, getInvoiceById);

router.post("/addwishlist", protect, addToWishlist);

router.delete("/deletewishlist", protect, removeFromWishlist);

router.get("/getwishlist", protect, getWishlist);

export default router;
