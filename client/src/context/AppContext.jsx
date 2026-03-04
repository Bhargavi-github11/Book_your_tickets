import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { dummyShowsData } from "../assets/assets";

const configuredBaseUrl = import.meta.env.VITE_BASE_URL;
if (configuredBaseUrl) {
  axios.defaults.baseURL = configuredBaseUrl;
}

const TOKEN_KEY = "movie_app_token";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem(TOKEN_KEY) || "");

  const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

  const location = useLocation();
  const navigate = useNavigate();

  const getToken = async () => authToken;

  const saveToken = (token) => {
    const normalizedToken = token || "";
    setAuthToken(normalizedToken);

    if (normalizedToken) {
      localStorage.setItem(TOKEN_KEY, normalizedToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  const authHeaders = () =>
    authToken
      ? { Authorization: `Bearer ${authToken}` }
      : {};

  const toSha256Hex = async (value) => {
    const encoded = new TextEncoder().encode(String(value || ""));
    const buffer = await window.crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  };

  const registerUser = async ({ name, email, password }) => {
    const normalizedPassword = String(password || "");
    const passwordDigest = await toSha256Hex(normalizedPassword);

    const { data } = await axios.post("/api/auth/register", {
      name: String(name || "").trim(),
      email: String(email || "").trim(),
      passwordDigest,
      passwordLength: normalizedPassword.length,
    });

    if (!data.success) {
      throw new Error(data.message || "Unable to create account");
    }

    saveToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginUser = async ({ email, password }) => {
    const passwordDigest = await toSha256Hex(password);

    const { data } = await axios.post("/api/auth/login", {
      email: String(email || "").trim(),
      passwordDigest,
    });

    if (!data.success) {
      throw new Error(data.message || "Unable to login");
    }

    saveToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logoutUser = () => {
    saveToken("");
    setUser(null);
    setIsAdmin(false);
    setFavoriteMovies([]);
    navigate("/signin");
  };

  const syncCurrentUser = async () => {
    if (!authToken) {
      setUser(null);
      return;
    }

    try {
      const { data } = await axios.get("/api/auth/me", {
        headers: authHeaders(),
      });

      if (data.success) {
        setUser(data.user);
      } else {
        saveToken("");
        setUser(null);
      }
    } catch (error) {
      saveToken("");
      setUser(null);
    }
  };

  const fetchIsAdmin = async () => {
    if (!authToken) {
      setIsAdmin(false);
      return;
    }

    try {
      const { data } = await axios.get("/api/admin/is-admin", {
        headers: authHeaders(),
      });
      setIsAdmin(Boolean(data.isAdmin));

      if (!data.isAdmin && location.pathname.startsWith("/admin")) {
        navigate("/");
        toast.error("You are not authorized to access admin dashboard");
      }
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchShows = async () => {
    try {
      const { data } = await axios.get("/api/show/all");
      if (data.success) {
        setShows(Array.isArray(data.shows) ? data.shows : []);
      } else {
        setShows(dummyShowsData);
      }
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }

      setShows(dummyShowsData);
    }
  };

  const fetchFavoriteMovies = async () => {
    if (!authToken) {
      setFavoriteMovies([]);
      return;
    }

    try {
      const { data } = await axios.get("/api/user/favorites", {
        headers: authHeaders(),
      });

      if (data.success) {
        setFavoriteMovies(Array.isArray(data.movies) ? data.movies : []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError") {
        return;
      }
    }
  };

  const isFavoriteMovie = (movieId) => {
    return favoriteMovies.some((movie) => String(movie._id) === String(movieId));
  };

  const updateFavoriteMovie = async (movieInput) => {
    if (!authToken) {
      navigate("/signin");
      return;
    }

    try {
      const movie =
        typeof movieInput === "object" && movieInput !== null
          ? movieInput
          : { _id: String(movieInput) };
      const movieId = String(movie._id || movie.id || "");

      if (!movieId) {
        toast.error("Invalid movie selected");
        return;
      }

      const { data } = await axios.post(
        "/api/user/update-favorite",
        { movieId, movieData: movie },
        { headers: authHeaders() }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.isFavorite ? "Added to favorites" : "Removed from favorites");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to update favorites";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    fetchShows();
  }, []);

  useEffect(() => {
    syncCurrentUser();
  }, [authToken]);

  useEffect(() => {
    if (authToken && user) {
      fetchIsAdmin();
      fetchFavoriteMovies();
    } else {
      setIsAdmin(false);
      setFavoriteMovies([]);
    }
  }, [authToken, user]);

  const value = {
    axios,
    fetchIsAdmin,
    user,
    getToken,
    navigate,
    isAdmin,
    shows,
    favoriteMovies,
    fetchFavoriteMovies,
    updateFavoriteMovie,
    isFavoriteMovie,
    image_base_url,
    registerUser,
    loginUser,
    logoutUser,
    authToken,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
