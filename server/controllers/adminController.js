

// API to check if user is admin 

import User from "../models/User.js";
import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import Movie from "../models/Movie.js";

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

export const isAdmin = async (req, res) => {
    res.json({success: true, isAdmin: true})
}

//API to get dashboard data 

export const getDashboardData = async (req, res) => {
    try{
        const bookings = await Booking.find({isPaid: true});
        const activeShows = await Show.find({showDateTime: {$gte: new Date()}}).populate("movie");

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking) => acc + booking.amount, 0),
            activeShows,
            totalUser
        }
        res.json({success: true, dashboardData})

    }catch(error){
        console.log(error)
        res.json({success: false, message: error.message})

    }
}


// API to get all shows 
 export const getAllShows = async (req, res) => {
    try{
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate("movie").sort({ showDateTime: 1 });
         res.json({success: true, shows})

    }catch(error){
        console.log(error)
        res.json({success: false, message: error.message})
    }
 }

 // API to get bookings

 export const getAllBookings = async (req, res) => {
    try{
        const bookings = await Booking.find({}).populate("user").populate({path: "show",
            populate: {path: "movie"}
        }).sort({createdAt: -1});
        res.json({success: true, bookings})

    }catch(error){
        console.log(error)
        res.json({success: false, message: error.message})
    }
 }

// API to create shows
export const createShows = async (req, res) => {
    try {
        const { movieId, movieData, showPrice, showDateTimes } = req.body || {};

        if (!movieId) {
            return res.json({ success: false, message: "movieId is required" });
        }

        if (!Array.isArray(showDateTimes) || showDateTimes.length === 0) {
            return res.json({ success: false, message: "Please add at least one show time" });
        }

        const price = Number(showPrice);
        if (!Number.isFinite(price) || price <= 0) {
            return res.json({ success: false, message: "Valid show price is required" });
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

        const uniqueDateTimes = [...new Set(showDateTimes.map((item) => new Date(item).toISOString()))];

        let createdCount = 0;
        let skippedCount = 0;

        for (const dateTime of uniqueDateTimes) {
            const exists = await Show.findOne({
                movie: normalizedMovieId,
                showDateTime: new Date(dateTime),
            }).select("_id");

            if (exists) {
                skippedCount += 1;
                continue;
            }

            await Show.create({
                movie: normalizedMovieId,
                showDateTime: new Date(dateTime),
                showPrice: price,
                occupiedSeats: {},
            });

            createdCount += 1;
        }

        res.json({
            success: true,
            message: `Shows created: ${createdCount}, skipped: ${skippedCount}`,
            createdCount,
            skippedCount,
        });
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}