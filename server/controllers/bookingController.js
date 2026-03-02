import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import Stripe from "stripe";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const getStripeWebhookSecret = () => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  return process.env.STRIPE_WEBHOOK_SECRET;
};

const resolveClientUrl = (req, clientOrigin) => {
  const providedClientOrigin = String(clientOrigin || "").trim();
  const requestOrigin = String(req.headers.origin || "").trim();

  const baseUrl = providedClientOrigin || requestOrigin || "http://localhost:5173";

  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const markBookingPaid = async (bookingId) => {
  if (!bookingId) return null;

  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  if (!booking.isPaid) {
    booking.isPaid = true;
    await booking.save();
  }

  return booking;
};

const toFullImageUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "";
  if (String(pathOrUrl).startsWith("http")) return pathOrUrl;
  return `${TMDB_IMAGE_BASE_URL}${pathOrUrl}`;
};

const normalizeMoviePayload = (movieData, movieId) => {
  if (!movieData) return null;

  return {
    _id: String(movieId),
    id: Number(movieData.id || movieId),
    title: movieData.title || "Untitled",
    overview: movieData.overview || "",
    poster_path: toFullImageUrl(movieData.poster_path),
    backdrop_path: toFullImageUrl(movieData.backdrop_path),
    release_date: movieData.release_date || "",
    original_language: movieData.original_language || "",
    tagline: movieData.tagline || "",
    genres: Array.isArray(movieData.genres) ? movieData.genres : [],
    casts: Array.isArray(movieData.casts) ? movieData.casts : [],
    vote_average: Number(movieData.vote_average || 0),
    runtime: Number(movieData.runtime || 0),
  };
};

const checkSeatsAvailability = async (showId, selectedSeats) => {
  const showData = await Show.findById(showId);
  if (!showData) return { available: false, showData: null };

  const occupiedSeats = showData.occupiedSeats || {};
  const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats[seat]);

  return { available: !isAnySeatTaken, showData };
};

export const createBooking = async (req, res) => {
  try {
    const { showId, selectedSeats, movieId, movieData, showDateTime, showPrice } = req.body || {};

    if (!Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.json({ success: false, message: "Please select at least one seat" });
    }

    const normalizedSeats = [...new Set(selectedSeats.map((seat) => String(seat).trim().toUpperCase()))]
      .filter(Boolean);

    if (normalizedSeats.length === 0) {
      return res.json({ success: false, message: "Please select valid seats" });
    }

    const userId = req.user.id;

    let finalShowId = showId;
    let showData = null;

    if (!finalShowId) {
      if (!movieId || !showDateTime) {
        return res.json({
          success: false,
          message: "showId or movieId+showDateTime is required",
        });
      }

      const normalizedMovieId = String(movieId);
      const normalizedMovie = normalizeMoviePayload(movieData, normalizedMovieId);

      if (normalizedMovie) {
        await Movie.findByIdAndUpdate(normalizedMovieId, normalizedMovie, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        });
      }

      const dateTime = new Date(showDateTime);
      showData = await Show.findOneAndUpdate(
        {
          movie: normalizedMovieId,
          showDateTime: dateTime,
        },
        {
          $setOnInsert: {
            movie: normalizedMovieId,
            showDateTime: dateTime,
            showPrice: Number(showPrice || 200),
            occupiedSeats: {},
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      finalShowId = String(showData._id);
    }

    const seatAvailabilityConditions = normalizedSeats.reduce((acc, seat) => {
      acc[`occupiedSeats.${seat}`] = { $exists: false };
      return acc;
    }, {});

    const seatReservationUpdate = normalizedSeats.reduce((acc, seat) => {
      acc[`occupiedSeats.${seat}`] = userId;
      return acc;
    }, {});

    const reservedShow = await Show.findOneAndUpdate(
      {
        _id: finalShowId,
        ...seatAvailabilityConditions,
      },
      {
        $set: seatReservationUpdate,
      },
      {
        new: true,
      }
    );

    if (!reservedShow) {
      return res.json({ success: false, message: "Selected seats are not available" });
    }

    let booking;
    try {
      booking = await Booking.create({
        user: userId,
        show: finalShowId,
        amount: reservedShow.showPrice * normalizedSeats.length,
        bookedSeats: normalizedSeats,
        isPaid: false,
      });
    } catch (creationError) {
      const rollbackUpdate = normalizedSeats.reduce((acc, seat) => {
        acc[`occupiedSeats.${seat}`] = "";
        return acc;
      }, {});

      await Show.findByIdAndUpdate(finalShowId, {
        $unset: rollbackUpdate,
      });

      throw creationError;
    }

    res.json({
      success: true,
      message: "Booking created. Complete payment to confirm.",
      bookingId: booking._id,
      booking,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const completeDummyPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id });

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.isPaid = true;
    await booking.save();

    res.json({ success: true, message: "Payment successful", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { clientOrigin } = req.body || {};

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id }).populate({
      path: "show",
      populate: { path: "movie" },
    });

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.json({ success: false, message: "Booking is already paid" });
    }

    const stripe = getStripeClient();
    const clientUrl = resolveClientUrl(req, clientOrigin);
    const currency = String(process.env.STRIPE_CURRENCY || "inr").toLowerCase();

    const movieTitle = booking.show?.movie?.title || "Movie Ticket";
    const seats = Array.isArray(booking.bookedSeats) ? booking.bookedSeats.join(", ") : "";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: Math.round(Number(booking.amount || 0) * 100),
            product_data: {
              name: movieTitle,
              description: seats ? `Seats: ${seats}` : "Movie ticket booking",
            },
          },
        },
      ],
      metadata: {
        bookingId: String(booking._id),
        userId: String(req.user.id),
      },
      customer_email: req.user.email,
      success_url: `${clientUrl}/payment/${bookingId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/${bookingId}?canceled=true`,
    });

    booking.paymentLink = session.url;
    await booking.save();

    res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const verifyStripePayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { sessionId } = req.body || {};

    if (!sessionId) {
      return res.json({ success: false, message: "sessionId is required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id }).populate({
      path: "show",
      populate: { path: "movie" },
    });

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.json({ success: true, message: "Payment already verified", booking });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const sessionBookingId = String(session.metadata?.bookingId || "");
    const sessionUserId = String(session.metadata?.userId || "");

    if (sessionBookingId !== String(booking._id) || sessionUserId !== String(req.user.id)) {
      return res.json({ success: false, message: "Invalid payment session" });
    }

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment not completed" });
    }

    await markBookingPaid(booking._id);

    const updatedBooking = await Booking.findById(booking._id).populate({
      path: "show",
      populate: { path: "movie" },
    });

    res.json({ success: true, message: "Payment verified successfully", booking: updatedBooking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const stripeWebhookHandler = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const webhookSecret = getStripeWebhookSecret();
    const signature = req.headers["stripe-signature"];

    if (!signature) {
      return res.status(400).send("Missing stripe-signature header");
    }

    const event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const bookingId = session?.metadata?.bookingId;
      await markBookingPaid(bookingId);
    }

    if (event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const bookingId = session?.metadata?.bookingId;
      await markBookingPaid(bookingId);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook error:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.id }).populate({
      path: "show",
      populate: { path: "movie" },
    });

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;
    const showData = await Show.findById(showId);

    if (!showData) {
      return res.json({ success: false, message: "Show not found" });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});
    res.json({ success: true, occupiedSeats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getOccupiedSeatsBySlot = async (req, res) => {
  try {
    const { movieId, showDateTime } = req.query || {};

    if (!movieId || !showDateTime) {
      return res.json({ success: false, message: "movieId and showDateTime are required" });
    }

    const show = await Show.findOne({
      movie: String(movieId),
      showDateTime: new Date(showDateTime),
    }).select("_id occupiedSeats");

    if (!show) {
      return res.json({ success: true, showId: null, occupiedSeats: [] });
    }

    const occupiedSeats = Object.keys(show.occupiedSeats || {});
    return res.json({ success: true, showId: String(show._id), occupiedSeats });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
