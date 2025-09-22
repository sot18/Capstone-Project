import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-xl font-bold">📘</div>
          <span className="text-xl font-semibold">StudyBuddy</span>
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-700">
          <Link to="/dashboard" className="hover:underline">Home</Link>
          <Link to="/notes" className="hover:underline">Notes</Link>
          <Link to="/upload" className="hover:underline">Upload</Link>
          <Link to="/signup" className="hover:underline">Sign up</Link>
          <Link to="/login" className="hover:underline">Log in</Link>
        </div>
      </div>
    </nav>
  );
}
