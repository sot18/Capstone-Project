import React from "react";
import { mount } from "cypress/react";
import Login from "../../../cypress/component/Login/Login.jsx";

import { BrowserRouter } from "react-router-dom";
//import Login from "./Login"; // Correct relative path

describe("Login Component", () => {
  it("renders without crashing", () => {
    mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  });

  it("allows typing in email and password fields", () => {
    mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get('input[type="email"]').type("test@example.com").should("have.value", "test@example.com");
    cy.get('input[type="password"]').type("mypassword").should("have.value", "mypassword");
  });

  it("calls handleSubmit on form submission", () => {
    const consoleSpy = cy.spy(console, "log");
    
    mount(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    cy.get('input[type="email"]').type("user@example.com");
    cy.get('input[type="password"]').type("password123");
    cy.get("form").submit().then(() => {
      expect(consoleSpy).to.be.calledWith("Email:", "user@example.com", "Password:", "password123");
    });
  });
});
