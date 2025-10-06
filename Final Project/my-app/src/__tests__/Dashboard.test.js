// __tests__/Dashboard.test.js
import React from "react";
import { render, screen } from "@testing-library/react";
import Dashboard from "../pages/Dashboard";
import { useAuth } from "../context/AuthContext";
import { BrowserRouter as Router } from "react-router-dom";

// Mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("Dashboard Component", () => {
  const steps = [
    { title: "Upload Your Notes", link: "/upload" },
    { title: "View Notes & Quizzes", link: "/notes" },
    { title: "Chat with AI", link: "/chat" },
  ];

  const renderWithRouter = (ui) => {
    return render(<Router>{ui}</Router>);
  };

  test("renders welcome message with displayName", () => {
    useAuth.mockReturnValue({ currentUser: { displayName: "Alice" } });
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/Welcome, Alice!/i)).toBeInTheDocument();
  });

  test("renders welcome message with email if displayName is missing", () => {
    useAuth.mockReturnValue({ currentUser: { email: "alice@example.com" } });
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/Welcome, alice@example.com!/i)).toBeInTheDocument();
  });

  test("renders default welcome message if currentUser is null", () => {
    useAuth.mockReturnValue({ currentUser: null });
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/Welcome, StudyBuddy User!/i)).toBeInTheDocument();
  });

  test("renders all Getting Started steps", () => {
    useAuth.mockReturnValue({ currentUser: { displayName: "Alice" } });
    renderWithRouter(<Dashboard />);

    steps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  test("each Getting Started step has correct link", () => {
    useAuth.mockReturnValue({ currentUser: { displayName: "Alice" } });
    renderWithRouter(<Dashboard />);

    steps.forEach((step) => {
      const linkElement = screen.getByText(step.title).closest("a");
      expect(linkElement).toHaveAttribute("href", step.link);
    });
  });

});
