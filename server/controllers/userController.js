

// API Controller for Function to get User Bookings

import { clerkClient, getAuth } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

const ensureUserInDb = async (clerkUser) => {
  const userId = clerkUser.id;
  const existing = await User.findById(userId);
  const roleFromMeta =
    clerkUser.privateMetadata?.role ||
    clerkUser.publicMetadata?.role ||
    (clerkUser.privateMetadata?.isAdmin === true ? "admin" : null) ||
    "user";

  if (!existing) {
    await User.create({
      _id: userId,
      name:
        clerkUser.fullName ||
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        clerkUser.username ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        "User",
      email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
      image: clerkUser.imageUrl || "",
      role: roleFromMeta,
    });
  } else if (existing.role !== roleFromMeta) {
    existing.role = roleFromMeta;
    existing.name =
      clerkUser.fullName ||
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      existing.name;
    existing.email =
      clerkUser.emailAddresses?.[0]?.emailAddress || existing.email;
    existing.image = clerkUser.imageUrl || existing.image;
    await existing.save();
  }
};

export const syncCurrentUser = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.json({ success: false, message: "not authenticated" });
    }
    const clerkUser = await clerkClient.users.getUser(userId);
    await ensureUserInDb(clerkUser);
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const clerkUser = await clerkClient.users.getUser(userId);
    await ensureUserInDb(clerkUser);
    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API Controller to Update Favorite Movie in Clerk User Metadata
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const { userId } = getAuth(req);

    const user = await clerkClient.users.getUser(userId);
    await ensureUserInDb(user);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
      user.privateMetadata.favorites.push(movieId);
    } else {
      user.privateMetadata.favorites = user.privateMetadata.favorites.filter(
        (item) => item !== movieId
      );
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: user.privateMetadata,
    });

    res.json({ success: true, message: " Favorite movies updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const user = await clerkClient.users.getUser(userId);
    await ensureUserInDb(user);
    const favorites = user.privateMetadata.favorites || [];

    const movies = await Movie.find({
      _id: { $in: favorites },
    });

    res.json({ success: true, movies });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to upgrade a logged-in user to admin using a secret code
export const upgradeToAdmin = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { code } = req.body || {};

    if (!code) {
      return res.json({ success: false, message: "Admin code is required" });
    }

    const expectedCode = process.env.ADMIN_SIGNUP_CODE;

    if (!expectedCode) {
      return res.json({
        success: false,
        message: "Admin signup code is not configured on server",
      });
    }

    if (code !== expectedCode) {
      return res.json({ success: false, message: "Invalid admin code" });
    }

    const clerkUser = await clerkClient.users.getUser(userId);
    const currentPrivateMeta = clerkUser.privateMetadata || {};

    const updatedPrivateMeta = {
      ...currentPrivateMeta,
      isAdmin: true,
      role: "admin",
    };

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: updatedPrivateMeta,
    });

    // Also reflect admin role in MongoDB
    await User.findByIdAndUpdate(
      userId,
      {
        _id: userId,
        name:
          clerkUser.fullName ||
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
          clerkUser.username ||
          clerkUser.emailAddresses?.[0]?.emailAddress ||
          "User",
        email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
        image: clerkUser.imageUrl || "",
        role: "admin",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "You have been upgraded to admin successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};