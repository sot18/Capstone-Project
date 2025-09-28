// src/components/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // redirect to login after logout
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xl font-bold">
            📘
          </div>
          <span className="text-xl font-semibold">StudyBuddy</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-700">
          <Link to="/dashboard" className="hover:underline">
            Home
          </Link>
          <Link to="/notes" className="hover:underline">
            Notes
          </Link>
          <Link to="/upload" className="hover:underline">
            Upload
          </Link>

          {user ? (
            <>
              <Link to="/profile" className="hover:underline">
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="hover:underline text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="hover:underline">
                Sign up
              </Link>
              <Link to="/login" className="hover:underline">
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
