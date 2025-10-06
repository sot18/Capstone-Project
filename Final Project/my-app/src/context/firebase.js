export const auth = {
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
};

export const db = {
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
};

export default { auth, db };
