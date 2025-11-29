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

import { logActivity } from "../utils/logActivity"; // <-- ensure this exists

const ViewNotes = () => {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  // -----------------------------
  // Track logged-in user
  // -----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) fetchNotes(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  // -----------------------------
  // Fetch notes for this user
  // -----------------------------
  const fetchNotes = async (uid) => {
    setLoading(true);
    setError("");
    try {
      const notesRef = collection(db, "notes");

      const q = query(
        notesRef,
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotes(list);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to fetch notes.");
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Delete note
  // -----------------------------
  const handleDelete = async (note) => {
    try {
      if (note.fileUrl && user) {
        const fileRef = ref(storage, `notes/${user.uid}/${note.fileName}`);
        await deleteObject(fileRef).catch(() => {});
      }

      await deleteDoc(doc(db, "notes", note.id));

      setNotes((prev) => prev.filter((n) => n.id !== note.id));

      // NEW — log deletion
      try {
        await logActivity(user.uid, `Deleted note: ${note.fileName}`);
        window.dispatchEvent(new Event("activityLogged"));
      } catch (e) {
        console.warn("Activity log failed:", e);
      }

    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete note.");
    }
  };

  // -----------------------------
  // Handle VIEW click — log activity
  // -----------------------------
  const handleView = async (note) => {
    try {
      await logActivity(user.uid, `Viewed note: ${note.fileName}`);
      window.dispatchEvent(new Event("activityLogged"));
    } catch (err) {
      console.warn("Failed to log view activity:", err);
    }

    // Open file in new tab
    window.open(note.fileUrl, "_blank");
  };

  // -----------------------------
  // Render UI
  // -----------------------------
  return (
    <div className="space-y-6">
      <div className="container-card">
        <h1 className="text-3xl font-bold mb-2">My Notes</h1>
        <p className="text-gray-600">Manage and review your uploaded notes.</p>
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
                <p className="text-lg font-semibold text-gray-800 mb-2">
                  {note.fileName}
                </p>

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
                <button
                  onClick={() => handleView(note)}
                  className="flex-1 text-center py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  View
                </button>

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
