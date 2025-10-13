import '@testing-library/jest-dom';
import 'whatwg-fetch'; // adds fetch() globally for Firebase etc.
// src/setupTests.js

// Add custom jest matchers from React Testing Library
import '@testing-library/jest-dom';

// ✅ Make fetch globally available before Firebase loads
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

// Mock browser-specific APIs that jsdom doesn’t support well
beforeAll(() => {
  // Prevent "scrollIntoView" errors during tests
  Element.prototype.scrollIntoView = jest.fn();

  // Optional: mock window.matchMedia (used by some UI libraries like Material UI)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});



