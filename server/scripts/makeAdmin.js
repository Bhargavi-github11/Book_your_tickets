import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const emailArg = process.argv[2];

if (!emailArg) {
  console.log("Usage: node scripts/makeAdmin.js <email>");
  process.exit(1);
}

const run = async () => {
  const email = String(emailArg).trim().toLowerCase();
  const mongoBaseUrl = process.env.MONGODB_URL;

  if (!mongoBaseUrl) {
    throw new Error("MONGODB_URL is missing in environment");
  }

  await mongoose.connect(`${mongoBaseUrl}/Book_Your_Ticket`);

  const users = mongoose.connection.db.collection("users");
  const result = await users.updateOne({ email }, { $set: { role: "admin" } });

  if (result.matchedCount === 0) {
    console.log("NO_USER_FOUND");
  } else {
    console.log("ADMIN_UPDATED");
  }

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error.message);
  try {
    await mongoose.disconnect();
  } catch {
  }
  process.exit(1);
});
