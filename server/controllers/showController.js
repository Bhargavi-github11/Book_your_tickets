import axios from "axios"

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original";

const tmdbHeaders = () => ({ Authorization: `Bearer ${process.env.TMDB_API_KEY}` });

const formatTmdbMovieForClient = (movie) => ({
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
    genre_ids: movie.genre_ids || [],
    genres: [],
    vote_average: Number(movie.vote_average || 0),
    vote_count: Number(movie.vote_count || 0),
    runtime: 0,
    casts: [],
});

const fetchNowPlayingFromTmdb = async (page = 1) => {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
        headers: tmdbHeaders(),
        params: { page },
    })
    return {
        movies: data.results || [],
        page: Number(data.page || page),
        totalPages: Number(data.total_pages || 1),
    };
}

const fetchPopularFromTmdb = async (page = 1) => {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/popular', {
        headers: tmdbHeaders(),
        params: { page },
    })
    return {
        movies: data.results || [],
        page: Number(data.page || page),
        totalPages: Number(data.total_pages || 1),
    };
}

const fetchUpcomingFromTmdb = async (page = 1) => {
    const { data } = await axios.get('https://api.themoviedb.org/3/movie/upcoming', {
        headers: tmdbHeaders(),
        params: { page },
    })
    return {
        movies: data.results || [],
        page: Number(data.page || page),
        totalPages: Number(data.total_pages || 1),
    };
}

const fetchDiscoverFromTmdb = async ({ page = 1, genre, language, year, mode }) => {
    const today = new Date().toISOString().slice(0, 10)
    const params = {
        page,
        include_adult: false,
        include_video: false,
        sort_by: 'popularity.desc',
    }

    if (genre) params.with_genres = genre
    if (language) params.with_original_language = language
    if (year) params.primary_release_year = year

    if (mode === 'theaters') {
        params['release_date.lte'] = today
        params['with_release_type'] = '2|3'
    }

    if (mode === 'releases') {
        params['release_date.gte'] = today
    }

    const { data } = await axios.get('https://api.themoviedb.org/3/discover/movie', {
        headers: tmdbHeaders(),
        params,
    })

    return {
        movies: data.results || [],
        page: Number(data.page || page),
        totalPages: Number(data.total_pages || 1),
    }
}

const isFilterRequested = (query = {}) => {
    const { genre, language, year } = query
    return Boolean(genre || language || year)
}

const sendTmdbListResponse = async (req, res, fetcher, keyName) => {
    const requestedPage = Number(req.query.page || 1);
    const safePage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const { movies, page, totalPages } = await fetcher(safePage);
    const enrichedMovies = await enrichMovies(movies);

    return res.json({
        success: true,
        [keyName]: enrichedMovies,
        page,
        totalPages,
        hasNextPage: page < totalPages,
    })
}

const fetchMovieDetails = async (movieId) => {
    try {
        const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}`, {
            headers: tmdbHeaders(),
            params: { append_to_response: 'credits' },
        });
        return data;
    } catch (error) {
        return null;
    }
}

const enrichMovies = async (movies) => {
    const detailedMovies = await Promise.all(
        movies.map(async (movie) => {
            const details = await fetchMovieDetails(movie.id);
            if (!details) {
                return formatTmdbMovieForClient(movie);
            }

            const casts = (details.credits?.cast || [])
                .filter((cast) => cast.profile_path)
                .slice(0, 16)
                .map((cast) => ({
                    name: cast.name,
                    profile_path: `${TMDB_IMAGE_BASE_URL}${cast.profile_path}`,
                }));

            return {
                ...formatTmdbMovieForClient(movie),
                genres: details.genres || [],
                runtime: Number(details.runtime || 0),
                tagline: details.tagline || "",
                casts,
            };
        })
    );

    return detailedMovies;
}

export const getNowPlayingMovies = async (req, res)=>{
    try {
        await sendTmdbListResponse(req, res, fetchNowPlayingFromTmdb, "movies")
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }

}

export const getAllShows = async (req, res) => {
    try {
        await sendTmdbListResponse(req, res, fetchPopularFromTmdb, "shows")
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const getTheaterMovies = async (req, res) => {
    try {
        if (isFilterRequested(req.query)) {
            const requestedPage = Number(req.query.page || 1)
            const safePage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
            const { movies, page, totalPages } = await fetchDiscoverFromTmdb({
                page: safePage,
                genre: req.query.genre,
                language: req.query.language,
                year: req.query.year,
                mode: 'theaters',
            })
            const enrichedMovies = await enrichMovies(movies)
            return res.json({
                success: true,
                movies: enrichedMovies,
                page,
                totalPages,
                hasNextPage: page < totalPages,
            })
        }

        await sendTmdbListResponse(req, res, fetchNowPlayingFromTmdb, "movies")
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const getReleaseMovies = async (req, res) => {
    try {
        if (isFilterRequested(req.query)) {
            const requestedPage = Number(req.query.page || 1)
            const safePage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1
            const { movies, page, totalPages } = await fetchDiscoverFromTmdb({
                page: safePage,
                genre: req.query.genre,
                language: req.query.language,
                year: req.query.year,
                mode: 'releases',
            })
            const enrichedMovies = await enrichMovies(movies)
            return res.json({
                success: true,
                movies: enrichedMovies,
                page,
                totalPages,
                hasNextPage: page < totalPages,
            })
        }

        await sendTmdbListResponse(req, res, fetchUpcomingFromTmdb, "movies")
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message })
    }
}

export const getMovieTrailer = async (req, res) => {
    try {
        const { movieId } = req.params;
        if (!movieId) {
            return res.json({ success: false, message: "movieId is required" });
        }

        const { data } = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
            headers: tmdbHeaders(),
        });

        const videos = Array.isArray(data.results) ? data.results : [];
        const youtubeVideos = videos.filter((video) => video.site === "YouTube" && video.key);

        const trailer =
            youtubeVideos.find((video) => video.type === "Trailer" && video.official) ||
            youtubeVideos.find((video) => video.type === "Trailer") ||
            youtubeVideos[0];

        if (!trailer) {
            return res.json({ success: false, message: "Trailer not found" });
        }

        res.json({
            success: true,
            trailer: {
                key: trailer.key,
                name: trailer.name,
            },
        });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

const formatTmdbMovieDetailsForClient = (details) => {
    const casts = (details.credits?.cast || [])
        .filter((cast) => cast.profile_path)
        .slice(0, 16)
        .map((cast) => ({
            name: cast.name,
            profile_path: `${TMDB_IMAGE_BASE_URL}${cast.profile_path}`,
        }));

    return {
        _id: String(details.id),
        id: details.id,
        title: details.title,
        overview: details.overview || "",
        poster_path: details.poster_path ? `${TMDB_IMAGE_BASE_URL}${details.poster_path}` : "",
        backdrop_path: details.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${details.backdrop_path}` : "",
        release_date: details.release_date || "",
        original_language: details.original_language || "",
        genre_ids: Array.isArray(details.genres) ? details.genres.map((item) => item.id) : [],
        genres: details.genres || [],
        vote_average: Number(details.vote_average || 0),
        vote_count: Number(details.vote_count || 0),
        runtime: Number(details.runtime || 0),
        tagline: details.tagline || "",
        casts,
    };
}

export const getMovieById = async (req, res) => {
    try {
        const { movieId } = req.params;
        if (!movieId) {
            return res.json({ success: false, message: "movieId is required" });
        }

        const details = await fetchMovieDetails(movieId);
        if (!details) {
            return res.json({ success: false, message: "Movie not found" });
        }

        const movie = formatTmdbMovieDetailsForClient(details);
        res.json({ success: true, movie });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}