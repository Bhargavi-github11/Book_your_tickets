import { clerkClient, getAuth } from "@clerk/express";
import User from "../models/User.js";

export const protectAdmin = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.json({ success: false, message: "not authorized" });
    }

    const user = await clerkClient.users.getUser(userId);
    const dbUser = await User.findById(userId).lean();

    const privateMeta = user?.privateMetadata || {};
    const publicMeta = user?.publicMetadata || {};
    const unsafeMeta = user?.unsafeMetadata || {};

    const hasPrivateAdmin =
      privateMeta.role === "admin" || privateMeta.isAdmin === true;
    const hasPublicAdmin =
      publicMeta.role === "admin" || publicMeta.isAdmin === true;
    const hasUnsafeAdmin =
      unsafeMeta.role === "admin" || unsafeMeta.isAdmin === true;
    const hasDbAdmin = dbUser?.role === "admin";

    if (!hasPrivateAdmin && !hasPublicAdmin && !hasUnsafeAdmin && !hasDbAdmin) {
      return res.json({ success: false, message: "not authorized" });
    }

    next();
  } catch (error) {
    console.error("protectAdmin error:", error);
    return res.json({ success: false, message: "not authorized" });
  }
};