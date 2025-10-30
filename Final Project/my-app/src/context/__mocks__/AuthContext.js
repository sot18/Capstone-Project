// src/context/__mocks__/AuthContext.js

export const useAuth = jest.fn(() => ({
  user: { uid: "123", email: "test@example.com" },
  login: jest.fn(),
  logout: jest.fn(),
}));

// Mock for quiz functions
export const fetchQuizQuestions = jest.fn((noteId, difficulty) =>
  Promise.resolve([
    {
      question: "Q1?",
      choices: { A: "Option 1", B: "Option 2", C: "Option 3", D: "Option 4" },
      correctAnswer: "D",
    },
    {
      question: "Q2?",
      choices: { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
      correctAnswer: "C",
    },
  ])
);
