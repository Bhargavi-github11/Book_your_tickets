import express from "express";
import { getAuthPublicKey, login, me, register, resetPassword } from "../controllers/authController.js";
import { protectAuth } from "../middleware/auth.js";

const authRouter = express.Router();

authRouter.get("/public-key", getAuthPublicKey);
authRouter.post("/public-key", getAuthPublicKey);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/reset-password", resetPassword);
authRouter.get("/me", protectAuth, me);

export default authRouter;
