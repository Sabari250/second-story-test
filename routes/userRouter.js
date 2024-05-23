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
  addToCart,
  getCart,
  removeFromCart,
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

router.route("/cart").post(protect, addToCart).get(protect, getCart);
// .patch(protect, removeFromCart);

router.route("/cart/:bookId").delete(protect, removeFromCart);

export default router;
