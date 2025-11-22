import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../pages/Profile";
import { useAuth } from "../context/AuthContext";
import { getDoc, setDoc, getDocs } from "firebase/firestore";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";

jest.mock("../firebase", () => ({
  db: {},
  auth: {},
  storage: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  collection: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("axios");

describe("Profile Component", () => {
  const mockUser = { uid: "123", email: "test@example.com" };

  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        firstName: "John",
        lastName: "Doe",
        dob: "2000-01-01",
        email: "test@example.com",
        profilePicUrl: "http://example.com/pic.jpg",
        totalQuizzes: 5,
      }),
    });

    getDocs.mockResolvedValue({ docs: [] });
    setDoc.mockResolvedValue();

    // Mock /api/stats response
    axios.get.mockImplementation((url) => {
      if (url.includes("/api/stats")) {
        return Promise.resolve({
          data: {
            totalNotes: 7,
            totalQuizzesTaken: 3,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

  test("renders loading initially", () => {
    renderWithRouter(<Profile />);
    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
  });

  test("displays user info and recent activities", async () => {
    renderWithRouter(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/dob: 2000-01-01/i)).toBeInTheDocument();
    });
  });

  test("shows placeholder if no recent activities", async () => {
    renderWithRouter(<Profile />);
    await waitFor(() => {
      expect(screen.getByText("No recent activities")).toBeInTheDocument();
    });
  });

  test("shows loading if user not logged in", () => {
    useAuth.mockReturnValue({ user: null });
    renderWithRouter(<Profile />);
    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
  });

  // ----------------- New tests for stats -----------------
  test("displays total notes uploaded and quizzes taken", async () => {
    renderWithRouter(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(/Total Notes Uploaded: 7/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Quizzes Taken: 3/i)).toBeInTheDocument();
    });
  });

  test("handles empty stats gracefully", async () => {
    axios.get.mockResolvedValueOnce({ data: { totalNotes: 0, totalQuizzesTaken: 0 } });
    renderWithRouter(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(/Total Notes Uploaded: 0/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Quizzes Taken: 0/i)).toBeInTheDocument();
    });
  });

  test("handles stats API error", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));
    renderWithRouter(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load stats/i)).toBeInTheDocument();
    });
  });
});
