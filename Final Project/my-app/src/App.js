import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadNotes from "./pages/UploadNotes";
import ViewNotes from "./pages/ViewNotes";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { loading, user } = useAuth();

  if (loading) return <div>Loading...</div>; // wait for auth

  return (
    <Router>
      <Navbar />
      <main className="p-6 max-w-6xl mx-auto">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><UploadNotes /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><ViewNotes /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </main>
    </Router>
  );
}
