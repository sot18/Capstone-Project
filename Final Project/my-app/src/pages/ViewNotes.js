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
      const q = query(
        notesRef,
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotes(list);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to fetch notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (note) => {
    try {
      // Delete from Storage
      if (note.fileUrl) {
        const fileRef = ref(storage, `notes/${user.uid}/${note.fileName}`);
        await deleteObject(fileRef).catch(() => {});
      }

      // Delete from Firestore
      await deleteDoc(doc(db, "notes", note.id));
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete note.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="w-full max-w-4xl space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">My Notes</h2>

        {loading ? (
          <p className="text-gray-600 text-center">Loading...</p>
        ) : error ? (
          <p className="text-red-600 text-center">{error}</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-600 text-center">No notes uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl shadow-md p-5 flex flex-col justify-between"
              >
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
                    className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    View
                  </a>
                  <button
                    onClick={() => handleDelete(note)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewNotes;
