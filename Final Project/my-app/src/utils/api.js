jest.mock("../utils/api", () => ({
  sendMessageToApi: jest.fn((msg) =>
    Promise.resolve({ reply: `Mock reply: ${msg}` })
  ),
}));
