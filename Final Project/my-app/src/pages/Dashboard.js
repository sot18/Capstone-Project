import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { currentUser } = useAuth();

  // Placeholder until you wire in Firestore activity
  const recentActivity = [
    "Uploaded: Math Notes - Algebra",
    "Generated Quiz: Science - Photosynthesis",
    "Chatted with AI on History Notes",
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <h1 className="text-3xl font-bold mb-2">
          Welcome, {currentUser?.displayName || currentUser?.email || "StudyBuddy User"}!
        </h1>
        <p className="text-gray-600">
          Access your notes, chat with the AI, generate quizzes, and export results — all in one place.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="p-6 bg-white shadow-md rounded-xl">
          <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/upload"
              className="block w-full text-center border rounded py-2 hover:bg-gray-50"
            >
              Upload Notes
            </Link>
            <Link
              to="/notes"
              className="block w-full text-center border rounded py-2 hover:bg-gray-50"
            >
              View Notes & Quizzes
            </Link>
            <Link
              to="/notes"
              className="block w-full text-center border rounded py-2 hover:bg-gray-50"
            >
              Chat with AI (select note)
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="p-6 bg-white shadow-md rounded-xl md:col-span-2">
          <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <ul className="list-disc ml-6 text-gray-700">
              {recentActivity.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No activity yet — upload a note to get started.</p>
          )}
        </div>
      </div>
    </div>
  );
}
