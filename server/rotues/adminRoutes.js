import express from "express";
import { protectAdmin } from "../middleware/auth.js";
import { createShows, getAllBookings, getAllShows, getDashboardData, isAdmin } from "../controllers/adminController.js";
import { protectAuth } from "../middleware/auth.js";


const adminRouter = express.Router();

adminRouter.get('/is-admin', protectAuth, protectAdmin, isAdmin)
adminRouter.get('/dashboard', protectAuth, protectAdmin, getDashboardData)
adminRouter.get('/all-shows', protectAuth, protectAdmin, getAllShows)
adminRouter.get('/all-bookings', protectAuth, protectAdmin, getAllBookings)
adminRouter.post('/create-shows', protectAuth, protectAdmin, createShows)



export default adminRouter;
