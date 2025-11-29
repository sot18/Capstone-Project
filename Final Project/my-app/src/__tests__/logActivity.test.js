// src/utils/__tests__/logActivity.test.js
import { logActivity } from "../logActivity";

// Mock fetch
global.fetch = jest.fn();

describe("logActivity", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test("sends activity to backend", async () => {
    fetch.mockResolvedValueOnce({ ok: true });

    await logActivity("user123", "Test activity");

    expect(fetch).toHaveBeenCalledWith("http://localhost:5001/api/log_activity", expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: "user123", activity: "Test activity" }),
    }));
  });
});
