// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // wait for auth state

  if (!user) {
    // if not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children; // render the protected page
}
