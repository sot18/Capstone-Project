import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UploadNotes from "../pages/UploadNotes";

describe("UploadNotes Component", () => {
  test("renders upload form correctly", () => {
    render(<UploadNotes />);
    expect(screen.getByText(/Upload Notes/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upload/i })).toBeDisabled();
  });

  test("selecting a file enables the upload button", () => {
    render(<UploadNotes />);
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/click to choose/i);
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole("button", { name: /Upload/i })).not.toBeDisabled();
  });

  test("uploads file successfully", () => {
    render(<UploadNotes />);
    const file = new File(["dummy content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText(/click to choose/i);
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: /Upload/i }));
    expect(screen.getByText(/File uploaded successfully/i)).toBeInTheDocument();
  });

  test("rejects invalid file type", () => {
    render(<UploadNotes />);
    const file = new File(["dummy content"], "bad.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/click to choose/i);
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText(/Unsupported file type/i)).toBeInTheDocument();
  });

});
