// src/__tests__/ViewNotes.test.js
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ViewNotes from "../pages/ViewNotes";

// Mock Firebase modules
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

describe("ViewNotes Component", () => {
  const mockNotes = [
    { id: "1", fileName: "Note 1", fileUrl: "url1" },
    { id: "2", fileName: "Note 2", fileUrl: "url2" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders 'No notes uploaded yet.' when user has no notes", async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });

    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback({ uid: "123" });
      return jest.fn(); // unsubscribe
    });

    render(<ViewNotes />);

    await waitFor(() => {
      expect(screen.getByText("No notes uploaded yet.")).toBeInTheDocument();
    });
  });

  test("renders list of notes for a logged-in user", async () => {
  getDocs.mockResolvedValueOnce({
    docs: mockNotes.map((note) => ({
      id: note.id,
      data: () => ({ fileName: note.fileName, fileUrl: note.fileUrl }),
    })),
  });

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback({ uid: "123" });
    return jest.fn();
  });

  render(<ViewNotes />);

  // Wait for notes to render
  for (const note of mockNotes) {
    await waitFor(() => {
      expect(screen.getByText(note.fileName)).toBeInTheDocument();
    });
  }

  const viewLinks = screen.getAllByText("View");
  expect(viewLinks[0]).toHaveAttribute("href", mockNotes[0].fileUrl);
  expect(viewLinks[1]).toHaveAttribute("href", mockNotes[1].fileUrl);
});

test("deletes a note when delete button is clicked", async () => {
  getDocs.mockResolvedValueOnce({
    docs: mockNotes.map((note) => ({
      id: note.id,
      data: () => ({ fileName: note.fileName, fileUrl: note.fileUrl }),
    })),
  });

  deleteDoc.mockResolvedValueOnce();

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback({ uid: "123" });
    return jest.fn();
  });

  render(<ViewNotes />);

  // Wait for notes to render
  await screen.findByText(mockNotes[0].fileName);

  const deleteButtons = screen.getAllByText("Delete");
  fireEvent.click(deleteButtons[0]); // delete first note

  await waitFor(() => {
    expect(deleteDoc).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(mockNotes[0].fileName)).not.toBeInTheDocument();
    expect(screen.getByText(mockNotes[1].fileName)).toBeInTheDocument(); // second note remains
  });
});


  test("sets notes to empty if user is not logged in", async () => {
    onAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // No user
      return jest.fn();
    });

    render(<ViewNotes />);

    await waitFor(() => {
      expect(screen.getByText("No notes uploaded yet.")).toBeInTheDocument();
    });
  });
});
