import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const ResetPassword = () => {
  const { resetUserPassword } = useAppContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await resetUserPassword({ email, password, confirmPassword });
      toast.success("Password reset successful. Please sign in.");
      navigate("/signin");
    } catch (error) {
      toast.error(error.message || "Unable to reset password");
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
        <h1 className="text-2xl font-semibold text-center">Reset Password</h1>
        <p className="text-sm text-gray-400 text-center">
          Enter your email, new password and confirm password
        </p>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-gray-300">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="w-full px-3 py-2 rounded-md bg-black/30 border border-gray-600 outline-none"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full py-2 rounded-md bg-primary hover:bg-primary-dull transition disabled:opacity-60"
        >
          {loading ? "Resetting password..." : "Reset Password"}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Back to <Link className="text-primary" to="/signin">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPassword;
