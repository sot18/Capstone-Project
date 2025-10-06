// __mocks__/firebase.js
export const getAuth = jest.fn(() => ({
  currentUser: { uid: "testUser", email: "test@example.com" },
}));

export const getFirestore = jest.fn(() => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

export const getStorage = jest.fn(() => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
