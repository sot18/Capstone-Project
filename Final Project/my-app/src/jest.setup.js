// jest.setup.js
jest.mock("./src/firebase", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "testUser", email: "test@test.com" },
    onAuthStateChanged: jest.fn((callback) => {
      callback({ uid: "testUser", email: "test@test.com" });
      return jest.fn(); // unsubscribe
    }),
  })),
  getFirestore: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(async () => ({
    docs: [
      {
        id: "note1",
        data: () => ({
          uid: "testUser",
          fileName: "note.pdf",
          fileUrl: "url",
          createdAt: { seconds: 0 },
        }),
      },
    ],
  })),
  serverTimestamp: jest.fn(),
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(async () => "url"),
  deleteObject: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));
