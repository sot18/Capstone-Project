import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Quiz() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🧩 Fetch user's uploaded notes
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      try {
        console.log("Fetching notes for UID:", user.uid);
        const res = await fetch(`http://localhost:5001/api/notes?uid=${user.uid}`);
        const data = await res.json();
        console.log("Fetched notes:", data);
        setNotes(data);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [user]);

  // 🧠 Generate quiz based on selected note + difficulty
  const handleGenerateQuiz = async () => {
    if (!selectedNote) {
      alert("Please select a note first.");
      return;
    }

    setLoading(true);
    setQuiz([]);

    try {
      console.log("Selected note ID:", selectedNote);
      const res = await fetch("http://localhost:5001/api/generate_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          note_ids: [selectedNote],
          difficulty: difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Backend returned error:", data);
        throw new Error(`Failed to generate quiz (${res.status})`);
      }

      console.log("Quiz generated:", data);
      setQuiz(data.questions || []);
    } catch (err) {
      console.error("Error generating quiz:", err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">🧠 Generate Quiz</h1>

      {/* Notes Dropdown */}
      <label htmlFor="notes" className="block mb-2 font-semibold">
        Select Notes:
      </label>
      <select
        id="notes"
        className="border rounded-lg p-2 w-full mb-4"
        value={selectedNote}
        onChange={(e) => setSelectedNote(e.target.value)}
      >
        <option value="">-- Choose a note --</option>
        {notes.length > 0 ? (
          notes.map((note) => (
            <option key={note.id} value={note.id}>
              {note.name || note.filename || "Untitled Note"}
            </option>
          ))
        ) : (
          <option disabled>No notes found. Please upload some notes first.</option>
        )}
      </select>

      {/* Difficulty Dropdown */}
      <label htmlFor="difficulty" className="block mb-2 font-semibold">
        Select Difficulty:
      </label>
      <select
        id="difficulty"
        className="border rounded-lg p-2 w-full mb-4"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="easy">Easy 🟢</option>
        <option value="medium">Medium 🟡</option>
        <option value="hard">Hard 🔴</option>
      </select>

      {/* Generate Button */}
      <button
        onClick={handleGenerateQuiz}
        disabled={loading}
        className={`w-full py-2 font-semibold text-white rounded-lg transition ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {/* Quiz Results */}
      {quiz.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Generated Questions:</h2>
          <ul className="list-decimal ml-6 space-y-2">
            {quiz.map((q, i) => (
              <li key={i}>
                <p className="font-medium">{q.question}</p>
                {q.options && (
                  <ul className="list-disc ml-6">
                    {q.options.map((opt, j) => (
                      <li key={j}>{opt}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
