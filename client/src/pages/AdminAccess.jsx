import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';

const AdminAccess = () => {
  const { axios, getToken, navigate, user } = useAppContext();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter the admin code');
      return;
    }
    try {
      setLoading(true);
      const { data } = await axios.post(
        '/api/user/upgrade-admin',
        { code: code.trim() },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );

      if (data.success) {
        toast.success(data.message || 'You are now an admin');
        // After upgrading, navigate to admin dashboard
        navigate('/admin');
      } else {
        toast.error(data.message || 'Invalid admin code');
      }
    } catch (error) {
      console.error(error);
      toast.error('Something went wrong, please try again');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Please sign in first to use the admin code.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-black/70 border border-primary/30 rounded-lg p-6 w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-semibold text-white text-center">
          Admin Access
        </h1>
        <p className="text-sm text-gray-300 text-center">
          Enter the secret admin code to upgrade your account.
        </p>
        <input
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter admin code"
          className="w-full px-3 py-2 rounded-md bg-black/40 border border-gray-600 text-white outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-md bg-primary hover:bg-primary-dull transition text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Submit Code'}
        </button>
      </form>
    </div>
  );
};

export default AdminAccess;

