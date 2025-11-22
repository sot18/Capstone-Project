// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);

  // Keep only this statistic (local)
  const [totalNotes, setTotalNotes] = useState(0);

  // Stats from backend
  const [backendTotalNotes, setBackendTotalNotes] = useState(null);
  const [backendTotalQuizzes, setBackendTotalQuizzes] = useState(null);

  useEffect(() => {
    if (!user) return;

    const ensureUserDocExists = async () => {
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          firstName: "",
          lastName: "",
          email: user.email,
          dob: "",
          totalQuizzes: 0,
          profilePicUrl: "",
        });
      }
      return userRef;
    };

    const fetchUserData = async () => {
      try {
        const userRef = await ensureUserDocExists();
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          setUserData(docSnap.data());
          if (docSnap.data().profilePicUrl) {
            setProfilePic(docSnap.data().profilePicUrl);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    const fetchActivities = async () => {
      try {
        const activitiesRef = collection(db, "activities");
        const q = query(
          activitiesRef,
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const activities = snapshot.docs.map((doc) => doc.data().description);
        setRecentActivities(
          activities.length > 0 ? activities : ["No recent activities"]
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
        setRecentActivities(["No recent activities"]);
      }
    };

    const fetchNoteStats = async () => {
      try {
        const notesRef = collection(db, "notes");

        // Count all notes uploaded by this user
        const q1 = query(notesRef, where("userId", "==", user.uid));
        const allNotesSnap = await getDocs(q1);
        setTotalNotes(allNotesSnap.size);
      } catch (err) {
        console.error("Error counting notes:", err);
      }
    };

    // NEW: fetch authoritative stats from backend
    const fetchStats = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/stats?uid=${user.uid}`);
        const data = await res.json();
        if (!res.ok) {
          console.warn("Stats fetch failed:", data);
          return;
        }
        setBackendTotalNotes(data.totalNotes ?? null);
        setBackendTotalQuizzes(data.totalQuizzesTaken ?? null);
        // Optionally update userData.totalQuizzes with backend value
        setUserData((prev) => ({
          ...prev,
          totalQuizzes: data.totalQuizzesTaken ?? prev?.totalQuizzes,
        }));
        // Optionally update totalNotes to backend authoritative value
        setTotalNotes(data.totalNotes ?? ((prev) => prev));
      } catch (err) {
        console.error("Error fetching stats from backend:", err);
      }
    };

    fetchUserData();
    fetchActivities();
    fetchNoteStats();
    fetchStats();

    // Listen for quiz submissions to refresh stats
    const onQuizSubmitted = () => {
      fetchStats();
    };
    window.addEventListener("quizSubmitted", onQuizSubmitted);

    return () => {
      window.removeEventListener("quizSubmitted", onQuizSubmitted);
    };
  }, [user]);

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profilePics/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await setDoc(
        doc(db, "users", user.uid),
        { profilePicUrl: url },
        { merge: true }
      );

      setProfilePic(url);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  if (!userData) return <div>Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* User Info */}
      <div className="flex items-center space-x-4 mb-6">
        <img
          src={profilePic || "https://via.placeholder.com/80"}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h2 className="text-2xl font-bold">
            {userData.firstName || "First Name"} {userData.lastName || "Last Name"}
          </h2>
          <p className="text-gray-600">{userData.email}</p>
          <p className="text-gray-500 text-sm">
            DOB: {userData.dob || "Not provided"}
          </p>
        </div>
      </div>

      {/* Account Statistics */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Account Statistics</h3>

        <p><strong>Total Notes Uploaded:</strong> {backendTotalNotes !== null ? backendTotalNotes : totalNotes}</p>
        <p><strong>Total Quizzes Taken:</strong> {backendTotalQuizzes !== null ? backendTotalQuizzes : (userData.totalQuizzes || 0)}</p>

        <div className="flex space-x-2 mt-3">
          <label className="px-3 py-1 bg-blue-500 text-white rounded-lg cursor-pointer">
            {uploading ? "Uploading..." : "Edit Profile"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePicUpload}
            />
          </label>

          <button
            className="px-3 py-1 bg-green-500 text-white rounded-lg"
            onClick={() => navigate("/notes")}
          >
            View Notes
          </button>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white shadow-md rounded-xl p-4">
        <h3 className="text-lg font-semibold mb-2">Recent Activities</h3>
        <ul className="list-disc ml-6">
          {recentActivities.map((activity, index) => (
            <li key={index}>{activity}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
