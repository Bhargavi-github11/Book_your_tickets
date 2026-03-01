import express from "express";
import { completeDummyPayment, createBooking, getBookingById, getOccupiedSeats } from "../controllers/bookingController.js";
import { protectAuth } from "../middleware/auth.js";

const bookingRouter = express.Router();

bookingRouter.post('/create',protectAuth,createBooking)
bookingRouter.post('/pay/:bookingId',protectAuth,completeDummyPayment)
bookingRouter.get('/:bookingId', protectAuth, getBookingById)
bookingRouter.get('/seats/:showId', getOccupiedSeats)


export default bookingRouter;