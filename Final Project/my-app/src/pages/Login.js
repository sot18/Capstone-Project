// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard"); // redirect to home/dashboard after login
    } catch (err) {
      setError(err.message || "Failed to login");
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    // if already logged in, redirect to dashboard
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="p-6 shadow-md rounded-lg bg-white">
        <h2 className="text-2xl font-bold mb-4">Log in</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">Email</span>
            <input
              type="email"
              required
              className="w-full mt-1 p-2 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-600">Password</span>
            <input
              type="password"
              required
              className="w-full mt-1 p-2 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={!email || !password || busy}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60"
          >
            {busy ? "Logging in..." : "Log in"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-green-600 hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
