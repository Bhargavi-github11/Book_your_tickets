import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { protectAuth } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.get("/me", protectAuth, me);

export default authRouter;
