import express from "express";
import { completeDummyPayment, createBooking, createCheckoutSession, getBookingById, getOccupiedSeats, verifyStripePayment } from "../controllers/bookingController.js";
import { protectAuth } from "../middleware/auth.js";

const bookingRouter = express.Router();

bookingRouter.post('/create',protectAuth,createBooking)
bookingRouter.post('/pay/:bookingId',protectAuth,completeDummyPayment)
bookingRouter.post('/create-checkout-session/:bookingId', protectAuth, createCheckoutSession)
bookingRouter.post('/verify-payment/:bookingId', protectAuth, verifyStripePayment)
bookingRouter.get('/:bookingId', protectAuth, getBookingById)
bookingRouter.get('/seats/:showId', getOccupiedSeats)


export default bookingRouter;