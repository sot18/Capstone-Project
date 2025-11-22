import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Quiz from "../pages/Quiz";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

// Mock jsPDF and html2canvas so tests don't try to use browser APIs
jest.mock("jspdf", () => {
  return jest.fn().mockImplementation(() => ({
    save: jest.fn()
  }));
});

jest.mock("html2canvas", () => {
  return jest.fn().mockResolvedValue({
    toDataURL: jest.fn().mockReturnValue("fake-image-data")
  });
});

// Mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock axios for stats API
jest.mock("axios");

describe("Quiz Component", () => {
  const mockUser = { uid: "test-uid" };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ user: mockUser });
  });

  test("shows alert if no note is selected", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<Quiz />);
    const button = screen.getByRole("button", { name: /Generate Quiz/i });
    expect(button).toBeDisabled();
  });

  test("shows message when user has no notes", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(<Quiz />);
    expect(await screen.findByText(/No notes found. Please upload some notes first./i)).toBeInTheDocument();
  });

  test("generates and displays quiz questions when a note is selected", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: {
            id: "quiz1",
            questions: [{ question: "Sample question?", choices: ["A", "B", "C", "D"], correct_index: 0 }],
          },
        }),
      });

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));

    expect(await screen.findByText(/Sample question\?/i)).toBeInTheDocument();
    const optionA = await screen.findAllByText(/^A\./);
    const optionB = await screen.findAllByText(/^B\./);
    expect(optionA[0]).toBeInTheDocument();
    expect(optionB[0]).toBeInTheDocument();
  });

  test("grades the quiz and shows correct/wrong answers", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: {
            id: "quiz1",
            questions: [
              { question: "Q1?", choices: ["A", "B"], correct_index: 0 },
              { question: "Q2?", choices: ["C", "D"], correct_index: 1 },
            ],
          },
        }),
      });

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));

    await screen.findByText(/Q1\?/i);

    fireEvent.click(screen.getAllByLabelText(/B/i)[0]);
    fireEvent.click(screen.getAllByLabelText(/D/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Submit Quiz/i }));

    expect(
      await screen.findByText((content) =>
        content.includes("Your Answer: B") && content.includes("Correct: A")
      )
    ).toBeInTheDocument();

    expect(
      await screen.findByText((content) =>
        content.includes("Your Answer: None") && content.includes("Correct: B")
      )
    ).toBeInTheDocument();
  });

  test("resets quiz when 'Generate New Quiz' is clicked", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: { id: "quiz1", questions: [{ question: "Q1?", choices: ["A", "B"], correct_index: 0 }] },
        }),
      });

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    await screen.findByText(/Q1\?/i);

    fireEvent.click(screen.getAllByLabelText(/A/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /Submit Quiz/i }));
    fireEvent.click(screen.getByRole("button", { name: /Generate New Quiz/i }));

    expect(screen.queryByText(/Q1\?/i)).not.toBeInTheDocument();
  });

  test("records user's answer correctly when a choice is selected", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: { id: "quiz1", questions: [{ question: "Q1?", choices: ["A", "B"], correct_index: 0 }] },
        }),
      });

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    await screen.findByText(/Q1\?/i);

    const radioB = screen.getAllByLabelText(/B/i)[0];
    fireEvent.click(radioB);
    expect(radioB.checked).toBe(true);
  });

  test("shows loading message while fetching quiz", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    quiz: { id: "quiz1", questions: [{ question: "Delayed question?", choices: ["A"], correct_index: 0 }] },
                  }),
                }),
              100
            )
          )
      );

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));

    expect(screen.getByRole("button", { name: /Generating\.\.\./i })).toBeDisabled();
    await screen.findByText(/Delayed question\?/i);
  });

  test("disables Generate Quiz button while quiz is loading", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] });

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });

    const button = screen.getByRole("button", { name: /Generate Quiz/i });
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });

  test("shows alert if quiz fetch fails", async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) });

    window.alert = jest.fn();

    render(<Quiz />);
    await screen.findByText("Note 1");

    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to generate quiz. Please try again.");
    });
  });

  test("updates timer duration when user selects a time", async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] });

    render(<Quiz />);

    const timerSelect = await screen.findByLabelText(/Select Time/i);
    fireEvent.change(timerSelect, { target: { value: "120" } });
    expect(timerSelect.value).toBe("120");
  });

  test("starts countdown timer after generating quiz", async () => {
    jest.useFakeTimers();

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: { id: "quiz1", questions: [{ question: "Q1?", choices: ["A", "B"], correct_index: 0 }] },
        }),
      });

    render(<Quiz />);
    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.change(screen.getByLabelText(/Select Time/i), { target: { value: "60" } });

    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    await screen.findByText(/Q1\?/i);

    expect(screen.getByText("01:00")).toBeInTheDocument();
    jest.advanceTimersByTime(1000);
    expect(screen.getByText("00:59")).toBeInTheDocument();

    jest.useRealTimers();
  });

  test("auto-submits the quiz when timer expires", async () => {
    jest.useFakeTimers();

    fetch
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: "note1", name: "Note 1" }] })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quiz: { id: "quiz1", questions: [{ question: "Q1?", choices: ["A", "B"], correct_index: 0 }] },
        }),
      });

    render(<Quiz />);
    fireEvent.change(screen.getByLabelText(/Select Notes/i), { target: { value: "note1" } });
    fireEvent.change(screen.getByLabelText(/Select Time/i), { target: { value: "5" } });

    fireEvent.click(screen.getByRole("button", { name: /Generate Quiz/i }));
    await screen.findByText(/Q1\?/i);

    jest.advanceTimersByTime(5000);
    expect(await screen.findByText(/Correct Answer:/i)).toBeInTheDocument();

    jest.useRealTimers();
  });

  // ----------------- New tests for total quizzes taken -----------------
  test("displays total quizzes taken from API", async () => {
    axios.get.mockResolvedValueOnce({ data: { totalQuizzesTaken: 5 } });

    render(<Quiz />);
    await waitFor(() => {
      expect(screen.getByText(/Total Quizzes Taken: 5/i)).toBeInTheDocument();
    });
  });

  test("shows zero if user has not taken any quizzes", async () => {
    axios.get.mockResolvedValueOnce({ data: { totalQuizzesTaken: 0 } });

    render(<Quiz />);
    await waitFor(() => {
      expect(screen.getByText(/Total Quizzes Taken: 0/i)).toBeInTheDocument();
    });
  });

  test("handles API error when fetching total quizzes taken", async () => {
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    render(<Quiz />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to load quiz stats/i)).toBeInTheDocument();
    });
  });
});
