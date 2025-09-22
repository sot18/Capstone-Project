import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadNotes from "./pages/UploadNotes";
import ViewNotes from "./pages/ViewNotes";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <main className="p-6 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<UploadNotes />} />
            <Route path="/notes" element={<ViewNotes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
