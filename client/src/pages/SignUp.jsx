import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SignUp = () => {
  const { registerUser } = useAppContext();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await registerUser({ name, email, password });
      toast.success("Account created successfully");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Unable to create account");
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
        <h1 className="text-2xl font-semibold text-center">Create Account</h1>
        <p className="text-sm text-gray-400 text-center">Sign up with name, email and password</p>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

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
            minLength={6}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2 rounded-md bg-primary hover:bg-primary-dull transition disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Already have an account? <Link className="text-primary" to="/signin">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
