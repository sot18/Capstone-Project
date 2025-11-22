// src/pages/Signup.js
import React, { useState } from "react";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth"; // Firebase Auth functions
import { useNavigate, Link } from "react-router-dom"; // For navigation and routing
import { db } from "../firebase"; // Firestore instance
import { doc, setDoc } from "firebase/firestore"; // Firestore doc operations

export default function Signup() {
  // -----------------------------
  // State variables for form input
  // -----------------------------
  const [email, setEmail] = useState("");       // Email input
  const [password, setPassword] = useState(""); // Password input
  const [firstName, setFirstName] = useState(""); // First name input
  const [lastName, setLastName] = useState("");   // Last name input
  const [dob, setDob] = useState("");             // Date of birth input
  const [busy, setBusy] = useState(false);       // Tracks form submission state
  const [error, setError] = useState(null);      // Stores error messages
  const navigate = useNavigate();                // Navigate to another page

  const auth = getAuth(); // Firebase Auth instance

  // -----------------------------
  // Handle user signup
  // -----------------------------
  const handleSignup = async (e) => {
    e.preventDefault(); // Prevent page reload
    setError(null);     // Clear previous errors
    setBusy(true);      // Set busy state to disable button

    try {
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional profile info to Firestore under 'users' collection
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        dob,
        email,
      });

      // Immediately sign out so that login page can appear next
      await signOut(auth);

      // Redirect to login page after successful signup
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err); // For debugging

  // Map Firebase Auth error codes to friendly messages
  let message = "Signup failed. Please try again.";
  if (err.code) {
    switch (err.code) {
      case "auth/email-already-in-use":
        message = "This email is already in use.";
        break;
      case "auth/invalid-email":
        message = "The email address is invalid.";
        break;
      case "auth/operation-not-allowed":
        message = "Email/password accounts are not enabled.";
        break;
      case "auth/weak-password":
        message = "Password is too weak. Please use at least 6 characters.";
        break;
      default:
        message = err.message || message; // fallback to Firebase message
    }
  }

  setError(message);
    } finally {
      setBusy(false); // Reset busy state to enable button again
    }
  };

  // -----------------------------
  // Render Signup form
  // -----------------------------
  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="p-6 shadow-md rounded-lg bg-white">
        <h2 className="text-2xl font-bold mb-4">Sign up</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          {/* First Name Input */}
          <label className="block">
            <span className="text-sm text-gray-600">First Name</span>
            <input
              type="text"
              required
              className="w-full mt-1 p-2 border rounded"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>

          {/* Last Name Input */}
          <label className="block">
            <span className="text-sm text-gray-600">Last Name</span>
            <input
              type="text"
              required
              className="w-full mt-1 p-2 border rounded"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>

          {/* Date of Birth Input */}
          <label className="block">
            <span className="text-sm text-gray-600">Date of Birth</span>
            <input
              type="date"
              required
              className="w-full mt-1 p-2 border rounded"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </label>

          {/* Email Input */}
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

          {/* Password Input */}
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

          {/* Display error message */}
          {error && <div className="text-red-600 text-sm">{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!email || !password || !firstName || !lastName || !dob || busy} // Disable if any field is empty or busy
            className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {/* Link to Login page */}
        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
