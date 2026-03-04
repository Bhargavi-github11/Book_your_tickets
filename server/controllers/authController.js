import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { constants, createHash, createPublicKey, privateDecrypt } from "crypto";
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

const normalizePemKey = (value) => String(value || "").replace(/\\n/g, "\n").trim();

const decodeBase64ToString = (value) => {
  try {
    return Buffer.from(String(value || ""), "base64").toString("utf8").trim();
  } catch {
    return "";
  }
};

const looksLikePem = (value) => String(value || "").includes("-----BEGIN ");

const resolveEnvKey = (directName, base64Name) => {
  const directValue = normalizePemKey(process.env[directName]);
  if (looksLikePem(directValue)) {
    return directValue;
  }

  const decodedDirect = decodeBase64ToString(directValue);
  if (looksLikePem(decodedDirect)) {
    return decodedDirect;
  }

  const base64Value = normalizePemKey(process.env[base64Name]);
  const decodedBase64 = decodeBase64ToString(base64Value);
  if (looksLikePem(decodedBase64)) {
    return decodedBase64;
  }

  return "";
};

const getPrivateKey = () => resolveEnvKey("AUTH_PRIVATE_KEY", "AUTH_PRIVATE_KEY_BASE64");

const getPublicKey = () => {
  const configuredPublicKey = resolveEnvKey("AUTH_PUBLIC_KEY", "AUTH_PUBLIC_KEY_BASE64");
  if (configuredPublicKey) {
    return configuredPublicKey;
  }

  const privateKey = getPrivateKey();
  if (!privateKey) {
    return "";
  }

  try {
    return createPublicKey(privateKey).export({ type: "spki", format: "pem" }).toString();
  } catch {
    return "";
  }
};

const hasPrivateKey = () => Boolean(getPrivateKey());

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

const resolveLegacyPlainPassword = (body) => {
  const encryptedPassword = String(body?.passwordEncrypted || "").trim();
  if (!encryptedPassword) {
    return { plainPassword: "", attempted: false, decryptFailed: false };
  }

  const privateKey = getPrivateKey();
  if (!privateKey) {
    return { plainPassword: "", attempted: true, decryptFailed: true };
  }

  try {
    const encryptedBuffer = Buffer.from(encryptedPassword, "base64");
    const plainPassword = privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      encryptedBuffer
    ).toString("utf8");

    return { plainPassword, attempted: true, decryptFailed: false };
  } catch {
    return { plainPassword: "", attempted: true, decryptFailed: true };
  }
};

export const getAuthPublicKey = async (req, res) => {
  try {
    const publicKey = getPublicKey();

    if (!publicKey || !hasPrivateKey()) {
      return res.json({ success: false, message: "Auth encryption keys are not configured correctly" });
    }

    return res.json({ success: true, publicKey });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
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
    const passwordDigestFromPayload = resolveIncomingPassword(req.body);
    const legacy = resolveLegacyPlainPassword(req.body);

    const passwordDigest = passwordDigestFromPayload ||
      (legacy.plainPassword
        ? createHash("sha256").update(legacy.plainPassword).digest("hex")
        : "");

    if (!email || !passwordDigest) {
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

    const matchedDigest = await bcrypt.compare(passwordDigest, user.password);

    if (!matchedDigest) {
      const matchedLegacy = legacy.plainPassword
        ? await bcrypt.compare(legacy.plainPassword, user.password)
        : false;

      if (!matchedLegacy) {
        if (legacy.attempted && legacy.decryptFailed) {
          return res.json({
            success: false,
            message: "Auth key mismatch. Please contact support or reset password.",
          });
        }
        return res.json({ success: false, message: "Invalid email or password" });
      }

      user.password = await bcrypt.hash(passwordDigest, 10);
      await user.save();
    }

    const token = signToken(user);

    return res.json({ success: true, token, user: safeUser(user) });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body || {};

    if (!email || !password || !confirmPassword) {
      return res.json({
        success: false,
        message: "email, password and confirmPassword are required",
      });
    }

    if (String(password) !== String(confirmPassword)) {
      return res.json({ success: false, message: "Incorrect confirm password" });
    }

    if (String(password).length < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.json({ success: false, message: "Account not found" });
    }

    const passwordDigest = createHash("sha256").update(String(password)).digest("hex");
    user.password = await bcrypt.hash(passwordDigest, 10);
    await user.save();

    return res.json({ success: true, message: "Password reset successful" });
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
