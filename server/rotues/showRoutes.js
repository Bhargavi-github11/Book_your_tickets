import express from "express";
import { getNowPlayingMovies } from "../controllers/showController.js";

const showRoutes = express.Router();

showRoutes.get("/now-playing", getNowPlayingMovies )

export default showRoutes;