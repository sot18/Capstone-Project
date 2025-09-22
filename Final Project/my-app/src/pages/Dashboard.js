import React from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="container-card">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to StudyBuddy — access your notes, chat with the AI, generate quizzes and export results.</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="container-card">
          <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/upload" className="block w-full text-center border rounded py-2 hover:bg-gray-50">Upload Notes</Link>
            <Link to="/notes" className="block w-full text-center border rounded py-2 hover:bg-gray-50">View Notes & Quizzes</Link>
            {/* Placeholder for AI Chat entry */}
            <Link to="/notes" className="block w-full text-center border rounded py-2 hover:bg-gray-50">Chat with AI (select note)</Link>
          </div>
        </div>

        <div className="container-card col-span-2">
          <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
          <p className="text-gray-500">No activity yet — upload a note to get started.</p>
        </div>
      </div>
    </div>
  );
}
