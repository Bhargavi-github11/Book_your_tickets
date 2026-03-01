import express from "express";
import { completeDummyPayment, createBooking, createCheckoutSession, getBookingById, getOccupiedSeats, getOccupiedSeatsBySlot, verifyStripePayment } from "../controllers/bookingController.js";
import { protectAuth } from "../middleware/auth.js";

const bookingRouter = express.Router();

bookingRouter.post('/create',protectAuth,createBooking)
bookingRouter.post('/pay/:bookingId',protectAuth,completeDummyPayment)
bookingRouter.post('/create-checkout-session/:bookingId', protectAuth, createCheckoutSession)
bookingRouter.post('/verify-payment/:bookingId', protectAuth, verifyStripePayment)
bookingRouter.get('/seats/:showId', getOccupiedSeats)
bookingRouter.get('/seats', getOccupiedSeatsBySlot)
bookingRouter.get('/:bookingId', protectAuth, getBookingById)


export default bookingRouter;