import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FaUpload, FaBook, FaRobot } from "react-icons/fa";

export default function Dashboard() {
  const { currentUser } = useAuth();

  const steps = [
    {
      title: "Upload Your Notes",
      description: "Add your study notes to StudyBuddy so AI can help you review them.",
      icon: <FaUpload className="text-3xl text-blue-500" />,
      link: "/upload",
    },
    {
      title: "View Notes & Quizzes",
      description: "Browse your notes or generate quizzes to test your knowledge.",
      icon: <FaBook className="text-3xl text-green-500" />,
      link: "/notes",
    },
    {
      title: "Chat with AI",
      description: "Ask StudyBuddy questions based on your notes and get instant help.",
      icon: <FaRobot className="text-3xl text-purple-500" />,
      link: "/chat",
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="p-8 bg-white shadow-md rounded-xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome, {currentUser?.displayName || currentUser?.email || "StudyBuddy User"}!
        </h1>
        <p className="text-gray-700 mb-6">
          StudyBuddy centralizes your notes, quizzes, and AI support to help you study smarter.
        </p>
      </div>

      {/* Getting Started Section - cards act as buttons */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-center mb-4">Getting Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Link
              to={step.link}
              key={index}
              className="p-6 bg-white shadow-md rounded-xl flex flex-col items-center text-center hover:shadow-lg transition transform hover:-translate-y-1"
            >
              <div className="mb-4">{step.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
