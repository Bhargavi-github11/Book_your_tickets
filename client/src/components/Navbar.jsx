import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logoutUser } = useAppContext();
  const navigate = useNavigate();

  return (
    <div className="fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5">
      <Link to="/" className="max-md:flex-1">
        <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Frame<span className="text-primary">Flix</span></p>
      </Link>

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg 
        z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 
        md:px-8 py-3 max-md:h-screen md:rounded-full backdrop-blur 
        bg-black/70 md:bg-white/10 md:border border-gray-300/20 
        overflow-hidden transition-[width] duration-300 ${
        isOpen ? "max-md:w-full" : "max-md:w-0"
      }`}
      >
        <XIcon
          className="block md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />

        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/"
        >
          Home
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/movies"
        >
          Movies
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/theaters"
        >
          Theaters
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/releases"
        >
          Releases
        </Link>
        <Link
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false);
          }}
          to="/favorite"
        >
          Favorites
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-8">
        <SearchIcon className="max-md:hidden w-6 h-6 cursor-pointer" />

        {!user ? (
          <button
            onClick={() => navigate("/signin")}
            className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer"
          >
            Login
          </button>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate("/my-bookings")}
              className="hidden md:inline-flex items-center gap-1 px-4 py-2 text-xs bg-primary/80 hover:bg-primary rounded-full font-medium cursor-pointer"
            >
              <TicketPlus width={14} /> My Bookings
            </button>
            <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-semibold">
              {(user.name || user.email || "U")[0]?.toUpperCase()}
            </div>
            <button
              onClick={logoutUser}
              className="px-3 py-1.5 text-xs border border-gray-500 rounded-full hover:bg-white/10 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default Navbar;
