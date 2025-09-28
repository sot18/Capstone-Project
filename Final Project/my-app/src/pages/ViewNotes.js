// src/components/ViewNotes.js
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";

const ViewNotes = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchNotes(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  const fetchNotes = async (uid) => {
    setLoading(true);
    setError("");
    try {
      const notesRef = collection(db, "notes");

      // Use 'userId' to match Firestore rules
      const q = query(
        notesRef,
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotes(list);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to fetch notes. Check Firestore rules and indexes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (note) => {
    try {
      // Delete file from Storage
      if (note.fileUrl) {
        const fileRef = ref(storage, `notes/${user.uid}/${note.fileName}`);
        await deleteObject(fileRef).catch(() => {});
      }

      // Delete doc from Firestore
      await deleteDoc(doc(db, "notes", note.id));
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete note.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="container-card">
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-gray-600">Manage and review your uploaded notes below.</p>
      </div>

      {loading ? (
        <div className="container-card text-center text-gray-600">Loading...</div>
      ) : error ? (
        <div className="container-card text-center text-red-600">{error}</div>
      ) : notes.length === 0 ? (
        <div className="container-card text-center text-gray-600">No notes uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map((note) => (
            <div key={note.id} className="container-card flex flex-col justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-800 mb-2">{note.fileName}</p>
                <p className="text-sm text-gray-500">
                  Uploaded on{" "}
                  {note.createdAt
                    ? new Date(
                        note.createdAt.seconds
                          ? note.createdAt.seconds * 1000
                          : note.createdAt
                      ).toLocaleString()
                    : "Unknown"}
                </p>
              </div>
              <div className="mt-4 flex gap-3">
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(note)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewNotes;
