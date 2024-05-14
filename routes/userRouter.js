import express from "express";
import { signup, login } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

// router.get("/logout");


export default router;

