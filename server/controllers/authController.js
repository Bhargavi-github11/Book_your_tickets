import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { constants, privateDecrypt } from "crypto";
import User from "../models/User.js";

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

const normalizePemKey = (value) => String(value || "").replace(/\\n/g, "\n").trim();

const isProduction = () => String(process.env.NODE_ENV || "").toLowerCase() === "production";

const isAuthEncryptionConfigured = () =>
  Boolean(normalizePemKey(process.env.AUTH_PUBLIC_KEY) && normalizePemKey(process.env.AUTH_PRIVATE_KEY));

const decryptIncomingPassword = (passwordEncrypted) => {
  const privateKey = normalizePemKey(process.env.AUTH_PRIVATE_KEY);

  if (!privateKey) {
    throw new Error("Password encryption is enabled on client but AUTH_PRIVATE_KEY is missing");
  }

  const encryptedBuffer = Buffer.from(String(passwordEncrypted || ""), "base64");

  return privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    encryptedBuffer
  ).toString("utf8");
};

const resolvePassword = (body) => {
  const plainPassword = String(body?.password || "");
  if (plainPassword) {
    if (isProduction() || isAuthEncryptionConfigured()) {
      throw new Error("Plain password payload is disabled. Use encrypted password payload.");
    }
    return plainPassword;
  }

  const encryptedPassword = String(body?.passwordEncrypted || "");
  if (!encryptedPassword) return "";

  return decryptIncomingPassword(encryptedPassword);
};

export const getAuthPublicKey = async (req, res) => {
  try {
    const publicKey = normalizePemKey(process.env.AUTH_PUBLIC_KEY);

    if (!publicKey) {
      return res.json({ success: false, message: "AUTH_PUBLIC_KEY is not configured" });
    }

    return res.json({ success: true, publicKey });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { name, email } = req.body || {};
    const password = resolvePassword(req.body);

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "name, email and password are required",
      });
    }

    if (password.length < 6) {
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
    const password = resolvePassword(req.body);

    if (!email || !password) {
      return res.json({ success: false, message: "email and password are required" });
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
