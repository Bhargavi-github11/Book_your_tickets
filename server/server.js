import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js"
import showRoutes from "./rotues/showRoutes.js";
import userRoutes from "./rotues/userRoutes.js";
import adminRoutes from "./rotues/adminRoutes.js";
import bookingRoutes from "./rotues/bookingRoutes.js";
import authRoutes from "./rotues/authRoutes.js";


const app = express();
const port = 8181;

await connectDB();

// Middleware

app.use(express.json());
app.use(cors());

// API Routers
app.get("/", (req, res) => res.send("Server is Live!"));

// Set up the "/api/inngest" (recommended) routes with the serve handler
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/show", showRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/booking", bookingRoutes)

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
