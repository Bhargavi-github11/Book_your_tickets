import express from "express";
import { getAllShows, getMovieById, getMovieTrailer, getNowPlayingMovies } from "../controllers/showController.js";

const showRoutes = express.Router();

showRoutes.get("/now-playing", getNowPlayingMovies )
showRoutes.get("/all", getAllShows )
showRoutes.get("/trailer/:movieId", getMovieTrailer)
showRoutes.get("/:movieId", getMovieById)

export default showRoutes;