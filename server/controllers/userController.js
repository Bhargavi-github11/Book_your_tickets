import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";
import User from "../models/User.js";

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

const formatTmdbMovie = (movie) => ({
  _id: String(movie.id),
  id: movie.id,
  title: movie.title,
  overview: movie.overview || "",
  poster_path: movie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : "",
  backdrop_path: movie.backdrop_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}`
    : "",
  release_date: movie.release_date || "",
  original_language: movie.original_language || "",
  tagline: movie.tagline || "",
  genres: movie.genres || [],
  casts: [],
  vote_average: Number(movie.vote_average || 0),
  runtime: Number(movie.runtime || 0),
});

const getTmdbMovieById = async (movieId) => {
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`TMDB movie request failed for id ${movieId}`);
  }

  return response.json();
};

export const syncCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role image").lean();
    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateFavorite = async (req, res) => {
  try {
    const { movieId, movieData } = req.body || {};

    if (!movieId) {
      return res.json({ success: false, message: "movieId is required" });
    }

    const normalizedMovieId = String(movieId);

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    const existingFavorites = Array.isArray(user.favorites)
      ? user.favorites.map((item) => String(item))
      : [];

    const isAlreadyFavorite = existingFavorites.includes(normalizedMovieId);
    user.favorites = isAlreadyFavorite
      ? existingFavorites.filter((item) => item !== normalizedMovieId)
      : [...existingFavorites, normalizedMovieId];

    await user.save();

    if (!isAlreadyFavorite) {
      const existingMovie = await Movie.findById(normalizedMovieId).select("_id");

      if (!existingMovie) {
        const normalizedMovie = normalizeMoviePayload(movieData, normalizedMovieId);

        if (normalizedMovie) {
          await Movie.findByIdAndUpdate(normalizedMovieId, normalizedMovie, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          });
        } else {
          try {
            const tmdbMovie = await getTmdbMovieById(normalizedMovieId);
            await Movie.findByIdAndUpdate(
              normalizedMovieId,
              formatTmdbMovie(tmdbMovie),
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          } catch (tmdbError) {
            console.log("TMDB sync skipped:", tmdbError.message);
          }
        }
      }
    }

    res.json({
      success: true,
      message: "Favorite movies updated",
      isFavorite: !isAlreadyFavorite,
      favorites: user.favorites,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.json({ success: false, message: "user not found" });
    }

    const favoriteIds = Array.isArray(user.favorites)
      ? user.favorites.map((item) => String(item))
      : [];

    if (favoriteIds.length === 0) {
      return res.json({ success: true, movies: [] });
    }

    const dbMovies = await Movie.find({ _id: { $in: favoriteIds } }).lean();
    const dbMoviesById = new Map(dbMovies.map((movie) => [String(movie._id), movie]));

    const movies = await Promise.all(
      favoriteIds.map(async (movieId) => {
        const localMovie = dbMoviesById.get(movieId);
        if (localMovie) {
          return localMovie;
        }

        try {
          const tmdbMovie = await getTmdbMovieById(movieId);
          const formattedMovie = formatTmdbMovie(tmdbMovie);

          await Movie.findByIdAndUpdate(movieId, formattedMovie, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          });

          return formattedMovie;
        } catch (tmdbError) {
          console.log(`Unable to fetch TMDB movie ${movieId}:`, tmdbError.message);
          return null;
        }
      })
    );

    res.json({ success: true, movies: movies.filter(Boolean) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const upgradeToAdmin = async (req, res) => {
  try {
    const { code } = req.body || {};

    if (!code) {
      return res.json({ success: false, message: "Admin code is required" });
    }

    const expectedCode = process.env.ADMIN_SIGNUP_CODE;

    if (!expectedCode) {
      return res.json({
        success: false,
        message: "Admin signup code is not configured on server",
      });
    }

    if (code !== expectedCode) {
      return res.json({ success: false, message: "Invalid admin code" });
    }

    await User.findByIdAndUpdate(req.user.id, { role: "admin" }, { new: true });

    res.json({
      success: true,
      message: "You have been upgraded to admin successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
