// __tests__/ChatBox.test.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatBox from "../pages/ChatBox";

// Mock scrollIntoView for jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

// Suppress console.error for tests
beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe("ChatBox Component", () => {
  test("renders initial UI elements", () => {
    render(<ChatBox />);
    expect(screen.getByText("StudyBuddy Chat")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  test("typing in textarea updates value", () => {
    render(<ChatBox />);
    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(textarea.value).toBe("Hello");
  });

  test("sending empty message does nothing", () => {
    render(<ChatBox />);
    fireEvent.click(screen.getByText("Send"));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("sends user message and displays it with bot reply", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ reply: "Hi there!" }),
    });

    render(<ChatBox />);
    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.click(screen.getByText("Send"));

    // User message
    expect(await screen.findByText("Hello")).toBeInTheDocument();
    // Bot message
    expect(await screen.findByText("Hi there!")).toBeInTheDocument();
    // Textarea cleared
    expect(textarea.value).toBe("");
  });

  test("displays error message if fetch fails", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network Error"));

    render(<ChatBox />);
    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "Hello" } });
    fireEvent.click(screen.getByText("Send"));

    expect(await screen.findByText("Error: Could not connect to chatbot.")).toBeInTheDocument();
    // Textarea cleared after send attempt
    expect(textarea.value).toBe("");
  });

  test("sending message with Enter key works", async () => {
    global.fetch.mockResolvedValueOnce({
      json: async () => ({ reply: "Hi there!" }),
    });

    render(<ChatBox />);
    const textarea = screen.getByPlaceholderText("Type your message...");
    fireEvent.change(textarea, { target: { value: "Hello Enter" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });

    expect(await screen.findByText("Hello Enter")).toBeInTheDocument();
    expect(await screen.findByText("Hi there!")).toBeInTheDocument();
    expect(textarea.value).toBe("");
  });

});
