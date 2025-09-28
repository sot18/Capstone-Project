// src/pages/Signup.js
import React, { useState } from "react";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const auth = getAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional info to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        dob,
        email,
      });

      // Immediately sign out so login page can appear
      await signOut(auth);

      // Redirect to login
      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="p-6 shadow-md rounded-lg bg-white">
        <h2 className="text-2xl font-bold mb-4">Sign up</h2>
        <form onSubmit={handleSignup} className="space-y-4">
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
            disabled={!email || !password || !firstName || !lastName || !dob || busy}
            className="w-full bg-green-600 text-white py-2 rounded disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>

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
