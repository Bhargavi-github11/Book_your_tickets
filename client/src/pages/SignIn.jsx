import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SignIn = () => {
  const { loginUser } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await loginUser({ email, password });
      toast.success("Welcome back!");
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-primary/10 border border-primary/20 rounded-xl p-6 space-y-4"
      >
        <h1 className="text-2xl font-semibold text-center">Sign In</h1>
        <p className="text-sm text-gray-400 text-center">Use your email and password</p>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2 rounded-md bg-primary hover:bg-primary-dull transition disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Don&apos;t have an account? <Link className="text-primary" to="/signup">Sign up</Link>
        </p>
      </form>
    </div>
  );
};

export default SignIn;
