jest.mock("../context/AuthContext"); 
jest.mock("../firebase");            
jest.mock("react-router-dom", () => {
  const original = jest.requireActual("react-router-dom");
  return { ...original, useNavigate: () => jest.fn() };
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../pages/Login";
import { BrowserRouter } from "react-router-dom";

describe("Login Component", () => {
  test("renders login form", () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
  });

  test("successful login calls login function", async () => {
    const { useAuth } = require("../context/AuthContext");
    const { login } = useAuth();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    expect(login).toHaveBeenCalled();
  });
});
