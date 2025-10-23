import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Quiz from "../pages/Quiz";
import { useAuth } from "../context/AuthContext";


// Mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("Quiz Component", () => {
  const mockUser = { uid: "test-uid" };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test("shows alert if no note is selected", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    window.alert = jest.fn();

    render(<Quiz />);

    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    expect(window.alert).toHaveBeenCalledWith("Please select a note first.");
  });

   test("shows alert if no note is selected", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    window.alert = jest.fn();

    render(<Quiz />);

    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    expect(window.alert).toHaveBeenCalledWith("Please select a note first.");
  });

  test("shows message when user has no notes", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [], // No notes
  });

  render(<Quiz />);

  await waitFor(() =>
    expect(
      screen.getByText(/No notes found. Please upload some notes first./i)
    ).toBeInTheDocument()
  );
});

test("generates and displays quiz questions when a note is selected", async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [{ id: "note1", name: "Note 1" }],
  });

  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      questions: [
        { question: "Sample question?", options: ["A", "B", "C", "D"], answer: "A" },
      ],
    }),
  });

  render(<Quiz />);
  await waitFor(() => screen.getByText("Note 1"));

  fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
  fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));

  await waitFor(() => screen.getByText("Sample question?"));
  expect(screen.getByText("A")).toBeInTheDocument();
});
 
});
