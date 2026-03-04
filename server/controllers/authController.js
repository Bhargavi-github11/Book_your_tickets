import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const PASSWORD_DIGEST_REGEX = /^[a-f0-9]{64}$/i;

const signToken = (user) =>
  jwt.sign(
    { id: String(user._id), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const safeUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
  image: user.image || "",
});

const resolveIncomingPassword = (body) => {
  const passwordDigest = String(body?.passwordDigest || "").trim();
  if (passwordDigest) {
    if (!PASSWORD_DIGEST_REGEX.test(passwordDigest)) {
      throw new Error("Invalid passwordDigest format");
    }
    return passwordDigest.toLowerCase();
  }

  const plainPassword = String(body?.password || "");
  return plainPassword;
};

export const register = async (req, res) => {
  try {
    const { name, email, passwordLength } = req.body || {};
    const password = resolveIncomingPassword(req.body);

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "name, email and passwordDigest are required",
      });
    }

    const normalizedPasswordLength = Number(passwordLength || 0);
    if (normalizedPasswordLength > 0 && normalizedPasswordLength < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail }).select("+password");

    if (existingUser) {
      if (!existingUser.password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        existingUser.password = hashedPassword;
        if (!existingUser.name) {
          existingUser.name = String(name).trim();
        }
        if (!existingUser.role) {
          existingUser.role = "user";
        }
        if (!Array.isArray(existingUser.favorites)) {
          existingUser.favorites = [];
        }
        await existingUser.save();

        const token = signToken(existingUser);
        return res.json({
          success: true,
          token,
          user: safeUser(existingUser),
          message: "Account activated successfully",
        });
      }

      return res.json({ success: false, message: "Email already registered. Please sign in." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = signToken(user);

    return res.json({ success: true, token, user: safeUser(user) });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email } = req.body || {};
    const password = resolveIncomingPassword(req.body);

    if (!email || !password) {
      return res.json({ success: false, message: "email and passwordDigest are required" });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.json({ success: false, message: "Account not found. Please sign up first." });
    }

    if (!user.password) {
      return res.json({
        success: false,
        message: "This account needs password setup. Please sign up once with this email.",
      });
    }

    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    const token = signToken(user);

    return res.json({ success: true, token, user: safeUser(user) });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    return res.json({ success: true, user: safeUser(user) });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
