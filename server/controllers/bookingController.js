import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

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
      showData = await Show.findOne({
        movie: normalizedMovieId,
        showDateTime: dateTime,
      });

      if (!showData) {
        showData = await Show.create({
          movie: normalizedMovieId,
          showDateTime: dateTime,
          showPrice: Number(showPrice || 200),
          occupiedSeats: {},
        });
      }

      finalShowId = String(showData._id);
    }

    const { available, showData: resolvedShow } = await checkSeatsAvailability(finalShowId, selectedSeats);

    if (!available || !resolvedShow) {
      return res.json({ success: false, message: "Selected seats are not available" });
    }

    const booking = await Booking.create({
      user: userId,
      show: finalShowId,
      amount: resolvedShow.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
      isPaid: false,
    });

    selectedSeats.forEach((seat) => {
      resolvedShow.occupiedSeats[seat] = userId;
    });

    resolvedShow.markModified("occupiedSeats");
    await resolvedShow.save();

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
