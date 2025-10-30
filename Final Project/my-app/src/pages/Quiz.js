import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Quiz() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [quizId, setQuizId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Fetch user's uploaded notes
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/notes?uid=${user.uid}`);
        const data = await res.json();
        setNotes(data);
        if (data.length === 1) setSelectedNote(data[0].id);
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [user]);

  // Generate quiz based on selected note + difficulty
  const handleGenerateQuiz = async () => {
    if (!user || !user.uid) return alert("Please log in first.");
    if (!selectedNote) return alert("Please select a note first.");

    setLoading(true);
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setResultData(null);

    const payload = {
      uid: user.uid,
      note_ids: [selectedNote],
      difficulty,
    };

    try {
      const res = await fetch("http://localhost:5001/api/generate_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to generate quiz (${res.status})`);

      setQuiz(data.quiz?.questions || []);
      setQuizId(data.quiz?.id || "");
    } catch (err) {
      console.error("Error generating quiz:", err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Record user's answer
  const handleAnswer = (index, choiceLetter) => {
    setAnswers((prev) => ({ ...prev, [index]: choiceLetter }));
  };

  // Submit quiz answers
  const handleSubmitQuiz = () => {
    if (!quiz.length) return;

    let correctCount = 0;
    const review = quiz.map((q, i) => {
      const userAnswer = answers[i];
      const correctLetter = String.fromCharCode(65 + q.correct_index);
      if (userAnswer === correctLetter) correctCount++;
      return {
        question: q.question,
        choices: q.choices,
        userAnswer,
        correctAnswer: correctLetter,
      };
    });

    const totalQuestions = quiz.length;
    const calculatedScore = Math.round((correctCount / totalQuestions) * 100);

    setScore(calculatedScore);
    setSubmitted(true);
    setResultData({ totalQuestions, correctCount, review });
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">🧠 StudyBuddy Quiz</h1>

      {/* Notes Dropdown */}
      <label htmlFor="notes" className="block mb-2 font-semibold">Select Notes:</label>
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
              {note.name || "Untitled Note"}
            </option>
          ))
        ) : (
          <option disabled>No notes found. Please upload some notes first.</option>
        )}
      </select>

      {/* Difficulty Dropdown */}
      <label htmlFor="difficulty" className="block mb-2 font-semibold">Select Difficulty:</label>
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
        disabled={loading || !selectedNote}
        className={`w-full py-2 font-semibold text-white rounded-lg transition ${
          loading || !selectedNote ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {/* Quiz Display */}
      {quiz.length > 0 && !submitted && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Answer the Questions:</h2>
          <ul className="space-y-4">
            {quiz.map((q, i) => (
              <li key={i} className="p-4 bg-gray-50 rounded-lg border">
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                {q.choices.map((opt, j) => {
                  const letter = String.fromCharCode(65 + j);
                  return (
                    <label key={j} className="flex items-center mb-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === letter}
                        onChange={() => handleAnswer(i, letter)}
                        className="mr-2 accent-blue-600"
                        disabled={submitted}
                      />
                      <span>{letter}. {opt}</span>
                    </label>
                  );
                })}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubmitQuiz}
            disabled={loading}
            className={`mt-6 w-full py-2 font-semibold text-white rounded-lg transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}

      {/* Score & Review Display */}
      {submitted && resultData && (
        <div className="mt-6">
          <div className="text-center bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-green-700 mb-2">🎉 Quiz Completed!</h2>
            <p className="text-lg">Your Score: <span className="font-bold">{score}%</span></p>
            <p className="mt-1 text-gray-700 text-sm">
              Correct: {resultData.correctCount} / {resultData.totalQuestions}
            </p>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-2">Review:</h3>
          <ul className="space-y-4">
            {resultData.review.map((q, i) => (
              <li key={i} className="p-4 bg-gray-50 rounded-lg border">
                <p className="font-medium mb-1">{i + 1}. {q.question}</p>
                <ul className="mb-2">
                  {q.choices.map((opt, j) => {
                    const letter = String.fromCharCode(65 + j);
                    return (
                      <li key={j} className={`ml-4 ${letter === q.correctAnswer ? "font-bold text-green-700" : ""}`}>
                        {letter}. {opt} {letter === q.userAnswer && letter !== q.correctAnswer ? "(Your choice)" : ""}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-sm text-gray-700">
                  Your Answer: {q.userAnswer || "None"} | Correct: {q.correctAnswer}
                </p>
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              setQuiz([]);
              setAnswers({});
              setSubmitted(false);
              setScore(null);
              setResultData(null);
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Generate New Quiz
          </button>
        </div>
      )}
    </div>
  );
}
