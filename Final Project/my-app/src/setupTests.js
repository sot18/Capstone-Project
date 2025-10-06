import '@testing-library/jest-dom';
import 'whatwg-fetch'; // adds fetch() globally for Firebase etc.


// ✅ Make fetch globally available before Firebase loads
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}
