import React, { useState } from "react";
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import "./Auth.css";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [isLogin, setIsLogin] = useState(true); // 👈 Toggle state

  // Signup
  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Login
  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      setUser(userCredential.user);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Welcome</h2>

        {user ? (
          <>
            <p className="auth-user">Hello, {user.email}</p>
            <button className="btn logout" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            {/* Toggle Buttons */}
            <div className="toggle-buttons">
              <button
                className={`toggle-btn ${isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`toggle-btn ${!isLogin ? "active" : ""}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            {/* Form */}
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
            />

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
            />

            {isLogin ? (
              <button className="btn login" onClick={handleLogin}>
                Login
              </button>
            ) : (
              <button className="btn signup" onClick={handleSignup}>
                Sign Up
              </button>
            )}

            {error && <p className="auth-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
