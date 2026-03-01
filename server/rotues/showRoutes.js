import express from "express";
import { getAllShows, getMovieById, getMovieTrailer, getNowPlayingMovies, getReleaseMovies, getTheaterMovies } from "../controllers/showController.js";

const showRoutes = express.Router();

showRoutes.get("/now-playing", getNowPlayingMovies )
showRoutes.get("/all", getAllShows )
showRoutes.get("/theaters", getTheaterMovies)
showRoutes.get("/releases", getReleaseMovies)
showRoutes.get("/trailer/:movieId", getMovieTrailer)
showRoutes.get("/:movieId", getMovieById)

export default showRoutes;