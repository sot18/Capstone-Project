import React from "react";
import { render } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext";

// Custom render that includes AuthProvider
const customRender = (ui, options) =>
  render(<AuthProvider>{ui}</AuthProvider>, options);

export * from "@testing-library/react";
export { customRender as render };
