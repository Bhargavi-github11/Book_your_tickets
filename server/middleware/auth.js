import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protectAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.json({ success: false, message: "not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    return res.json({ success: false, message: "invalid token" });
  }
};

export const protectAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.json({ success: false, message: "not authorized" });
    }

    const user = await User.findById(req.user.id).lean();

    if (!user || user.role !== "admin") {
      return res.json({ success: false, message: "not authorized" });
    }

    next();
  } catch (error) {
    return res.json({ success: false, message: "not authorized" });
  }
};
