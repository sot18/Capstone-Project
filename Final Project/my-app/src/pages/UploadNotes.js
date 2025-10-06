import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const UploadNotes = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setMessage({ type: "error", text: "Unsupported file type" });
      setFile(null);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setMessage({ type: "error", text: "File is too large" });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setMessage({ type: "", text: "" });
  };

  const handleUpload = async () => {
    if (!file || !user) {
      setMessage({
        type: "error",
        text: "Select a file and make sure you're logged in.",
      });
      return;
    }

    setUploading(true);

    try {
      const storageRef = ref(storage, `notes/${user.uid}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "notes"), {
        userId: user.uid,
        fileName: file.name,
        fileUrl: url,
        createdAt: serverTimestamp(),
      });

      setMessage({ type: "success", text: "File uploaded successfully!" });
      setFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage({
        type: "error",
        text:
          error.code === "storage/unauthorized"
            ? "Upload failed: insufficient permissions. Check your Storage rules."
            : "Upload failed. Try again.",
      });
    }

    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="container-card">
        <h1 className="text-3xl font-bold mb-2">Upload Notes</h1>
        <p className="text-gray-600">
          Supported formats: <span className="font-semibold">.pdf</span>,{" "}
          <span className="font-semibold">.txt</span>
        </p>
      </div>

      <div className="container-card">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 mb-4 hover:border-blue-400 transition-colors duration-200">
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer w-full flex justify-center items-center py-10 text-gray-400 hover:text-blue-600 transition-colors"
          >
            {file ? file.name : "Click to choose a file or drag it here"}
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || !user || uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>

        {message.text && (
          <p
            className={`mt-4 text-center text-sm ${
              message.type === "success" ? "text-green-600" : "text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadNotes;
