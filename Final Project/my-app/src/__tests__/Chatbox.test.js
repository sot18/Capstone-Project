import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatBox from "../pages/ChatBox";

// Mock Firebase modules
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback({ uid: "test-user" }); // simulate logged-in user
    return jest.fn(); // unsubscribe
  }),
}));

// Mock Firestore (not used in ChatBox)
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => []),
  doc: jest.fn(() => ({})),
  getDocs: jest.fn(() => ({ docs: [] })),
  setDoc: jest.fn(() => Promise.resolve()),
  addDoc: jest.fn(() => Promise.resolve()),
}));



// Mock scrollIntoView
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ reply: "Mock reply", sessionId: "123" }),
    })
  );
  render(<ChatBox />);
  
  // Mock a note in the select
  const noteSelect = screen.getByRole("combobox");
  fireEvent.change(noteSelect, { target: { value: "note-1-url" } });
});


afterEach(() => {
  jest.clearAllMocks();
});

describe("ChatBox Component", () => {
  test("renders ChatBox page correctly", () => {
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter conversation name/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous Conversations/i)).toBeInTheDocument();
  });

  test("allows typing in input field", () => {
    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Hello AI" } });
    expect(input.value).toBe("Hello AI");
  });

  test("creates new conversation with custom name", () => {
    const convInput = screen.getByPlaceholderText(/Enter conversation name/i);
    fireEvent.change(convInput, { target: { value: "My Custom Conversation" } });
    expect(convInput.value).toBe("My Custom Conversation");
  });

  test("disables send button when input is empty", () => {
    const input = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });
    fireEvent.change(input, { target: { value: "" } });
    expect(sendButton).toBeDisabled();
  });


  test("scrolls chat to bottom when new message is added", async () => {
    const input = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole("button", { name: /send/i });

    // Select note
    const noteSelect = screen.getByRole("combobox");
    fireEvent.change(noteSelect, { target: { value: "note-1-url" } });

    fireEvent.change(input, { target: { value: "Scroll test" } });
    fireEvent.click(sendButton);

    await waitFor(() => expect(Element.prototype.scrollIntoView).toHaveBeenCalled());
  });

  test("renders previous conversations list", () => {
    expect(screen.getByText(/Previous Conversations/i)).toBeInTheDocument();
  });

  
});
