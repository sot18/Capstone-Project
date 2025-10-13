// __tests__/ChatBox.test.js
import React from "react";
import { render, screen, fireEvent, waitFor,within } from "@testing-library/react";
import ChatBox from "../pages/Chatbox"; // match your import path
//import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";



// ----------------------
// Mock Firebase Auth SDK
// ----------------------
jest.mock("firebase/auth", () => {
  return {
    getAuth: jest.fn(() => ({})),
    onAuthStateChanged: jest.fn((auth, callback) => {
      callback({ uid: "test-uid", email: "test@example.com" });
      return () => {};
    }),
  };
});

// ----------------------
// Common test setup
// ----------------------
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  // Default global fetch mock for normal tests
  global.fetch = jest.fn((url, options) => {
    if (typeof url === "string" && url.includes("/api/notes")) {
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: "note-1", url: "note-1-url", name: "Test Note 1" }],
      });
    }

    if (typeof url === "string" && url.includes("/api/chat")) {
      return Promise.resolve({
        ok: true,
        json: async () => ({ reply: "Hi there!" }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});

afterEach(() => {
  jest.clearAllMocks();
  delete global.fetch;
});

// ----------------------
// Standard ChatBox Tests
// ----------------------
describe("ChatBox Component", () => {
  test("renders ChatBox page correctly", async () => {
    render(<ChatBox />);
    expect(screen.getByText(/StudyBuddy Chat/i)).toBeInTheDocument();
    expect(await screen.findByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  test("allows typing in input field", async () => {
    render(<ChatBox />);
    const input = await screen.findByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Hello AI" } });
    expect(input.value).toBe("Hello AI");
  });

  test("sends message and displays user message", async () => {
    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Hello AI" } });
    fireEvent.click(sendButton);
    expect(await screen.findByText(/Hello AI/i)).toBeInTheDocument();
  });

  test("clears input field after sending message", async () => {
    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Clear this" } });
    fireEvent.click(sendButton);

    await waitFor(() => expect(input.value).toBe(""));
  });

  // -----------------------------
  // Fixed test: does not send empty message
  test("does not send empty message", async () => {
    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.click(sendButton);

    const chatCalls = global.fetch.mock.calls.filter((call) =>
      call[0].includes("/chat")
    );
    expect(chatCalls.length).toBe(0);
  });

  // -----------------------------
  // Fixed test: handles API error gracefully
  test("handles API error gracefully", async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes("/notes")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "note-1", url: "note-1-url", name: "Test Note 1" }],
        });
      }
      if (url.includes("/chat")) {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.change(input, { target: { value: "Error test" } });
    fireEvent.click(sendButton);

    await waitFor(() =>
      expect(
        screen.getByText(/No reply|Error/i)
      ).toBeInTheDocument()
    );
  });

  test("sends message when pressing Enter", async () => {
    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Enter key test" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(await screen.findByText(/Enter key test/i)).toBeInTheDocument();
  });

  test("scrolls chat to bottom when new message is added", async () => {
    const spy = jest.spyOn(Element.prototype, "scrollIntoView");
    render(<ChatBox />);
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "Scroll test" } });
    fireEvent.click(sendButton);

    await waitFor(() => expect(spy).toHaveBeenCalled());
    spy.mockRestore();
  });
});

// ----------------------
// User Story 3: AI Chatbot Integration
// ----------------------
describe("User Story 3: AI Chatbot Integration", () => {
  beforeEach(async () => {
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/notes")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "note-1", url: "note-1-url", name: "Basic Human Anatomy" }],
        });
      }
      if (url.includes("/chat")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ reply: "The skeletal system provides structure and support." }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<ChatBox />);
    await screen.findByRole("combobox");
  });

  test("3.1: Select note and ask relevant question", async () => {
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "What is the skeletal system?" } });
    fireEvent.click(sendButton);

    expect(await screen.findByText(/The skeletal system provides structure and support./i)).toBeInTheDocument();
  });

  test("3.2: Ask an unrelated question", async () => {
    const select = await screen.findByRole("combobox");
    fireEvent.change(select, { target: { value: "note-1-url" } });

    const input = await screen.findByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    fireEvent.change(input, { target: { value: "What is photosynthesis?" } });
    fireEvent.click(sendButton);

    expect(await screen.findByText(/I couldn’t find that in the note./i)).toBeInTheDocument();
  });

});
