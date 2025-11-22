// src/pages/Quiz.js
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Quiz() {
  const { user } = useAuth();

  // Notes + quiz state
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [quiz, setQuiz] = useState([]);
  const [quizId, setQuizId] = useState("");
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [resultData, setResultData] = useState(null);

  // Loading
  const [loading, setLoading] = useState(false);

  // Timer state
  const [timeLimit, setTimeLimit] = useState(0); // minutes (0 = no timer)
  const [timeLeft, setTimeLeft] = useState(0); // seconds
  const [timerRunning, setTimerRunning] = useState(false);

  // Fetch notes on mount / when user changes
  useEffect(() => {
    if (!user) return;
    const fetchNotes = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/notes?uid=${user.uid}`);
        const data = await res.json();
        setNotes(data || []);
        if (Array.isArray(data) && data.length === 1) {
          setSelectedNote(data[0].id);
        }
      } catch (err) {
        console.error("Error fetching notes:", err);
      }
    };
    fetchNotes();
  }, [user]);

  // Countdown effect
  useEffect(() => {
    if (!timerRunning || submitted) return;

    // If timeLeft is 0 at start, auto-submit immediately
    if (timeLeft === 0) {
      setTimerRunning(false);
      // Auto-submit: grade whatever answers exist
      handleSubmitQuiz({ auto: true });
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          // Auto-submit when timer hits 0
          handleSubmitQuiz({ auto: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, submitted]); // note: timeLeft intentionally not in deps because we use setter callback

  // Helper: format mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleGenerateQuiz = async () => {
    if (!user || !user.uid) return alert("Please log in first.");
    if (!selectedNote) return alert("Please select a note first.");

    setLoading(true);
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setResultData(null);
    setQuizId("");

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
      if (!res.ok) {
        throw new Error(data.error || `Failed to generate quiz (${res.status})`);
      }

      const questions = data.quiz?.questions || [];
      setQuiz(questions);
      setQuizId(data.quiz?.id || "");

      // Start timer if selected
      if (timeLimit > 0) {
        setTimeLeft(timeLimit * 60); // convert minutes to seconds
        setTimerRunning(true);
      } else {
        setTimeLeft(0);
        setTimerRunning(false);
      }
    } catch (err) {
      console.error("Error generating quiz:", err);
      alert("Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index, choiceLetter) => {
    if (submitted || timeLeft === 0) return;
    setAnswers((prev) => ({ ...prev, [index]: choiceLetter }));
  };

  // helper to POST quiz results to backend
  const postQuizResultsToBackend = async (payloadAnswersObj, finalScore, correctCount, totalQ) => {
    if (!user || !user.uid) return;
    try {
      await fetch("http://localhost:5001/api/submit_quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          quiz_id: quizId,
          answers: payloadAnswersObj,
        }),
      });
      // notify profile to refresh stats
      window.dispatchEvent(new Event("quizSubmitted"));
    } catch (err) {
      console.error("Error posting quiz results to backend:", err);
    }
  };

  // handleSubmitQuiz options: if { auto: true } then we won't require all answers
  const handleSubmitQuiz = ({ auto = false } = {}) => {
    if (!quiz.length) return;

    if (!auto) {
      // manual submit: ensure they want to submit if not all answered
      const answeredCount = Object.keys(answers).length;
      if (answeredCount !== quiz.length) {
        const proceed = window.confirm(
          `You answered ${answeredCount} of ${quiz.length} questions. Submit anyway?`
        );
        if (!proceed) return;
      }
    }

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

    // stop timer if it's running
    setTimerRunning(false);
    setTimeLeft((prev) => prev); // leave as-is (likely 0 if auto, or remaining time)

    // NEW: convert answers (letters) to numeric indices (0,1,2,3) for backend
    const payloadAnswers = {};
    Object.keys(answers).forEach((key) => {
      const val = answers[key];
      if (typeof val === "string") {
        const num = val.charCodeAt(0) - 65;
        if (!Number.isNaN(num)) {
          payloadAnswers[key] = num;
        }
      } else {
        // if already numeric (rare), send as int
        try {
          payloadAnswers[key] = parseInt(val, 10);
        } catch (e) {
          // skip invalid
        }
      }
    });

    // POST results to backend so it saves and increments quiz counter (non-blocking)
    postQuizResultsToBackend(payloadAnswers, calculatedScore, correctCount, totalQuestions);
  };

  // Improved PDF download (handles multi-page)
  const handleDownloadPDF = () => {
    const resultSection = document.getElementById("quiz-results");
    if (!resultSection) return;

    html2canvas(resultSection, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      // First page
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Additional pages
      while (heightLeft > 0) {
        position = 10 - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("quiz-results.pdf");
    });
  };

  if (!user) return <p>Loading user...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-4 text-center">🧠 StudyBuddy Quiz</h1>

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

      {/* Timer selector (Option 1 - directly under Select Note) */}
      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Quiz Time:</label>
        <select
          className="border rounded-lg p-2 w-full"
          value={timeLimit}
          onChange={(e) => setTimeLimit(Number(e.target.value))}
          disabled={loading || (quiz.length > 0 && !submitted)} // prevent changing during an active quiz
        >
          <option value={0}>No timer</option>
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={20}>20 minutes</option>
        </select>
      </div>

      <label htmlFor="difficulty" className="block mb-2 font-semibold">Select Difficulty:</label>
      <select
        id="difficulty"
        className="border rounded-lg p-2 w-full mb-4"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
        disabled={loading || (quiz.length > 0 && !submitted)}
      >
        <option value="easy">Easy 🟢</option>
        <option value="medium">Medium 🟡</option>
        <option value="hard">Hard 🔴</option>
      </select>

      <button
        onClick={handleGenerateQuiz}
        disabled={loading || !selectedNote}
        className={`w-full py-2 font-semibold text-white rounded-lg transition ${
          loading || !selectedNote ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Generating..." : "Generate Quiz"}
      </button>

      {/* Timer display */}
      {quiz.length > 0 && (timerRunning || timeLeft > 0) && (
        <div className="mt-4 p-3 bg-yellow-100 border rounded mb-4 text-center font-semibold">
          ⏳ Time Remaining: {formatTime(timeLeft)}
        </div>
      )}

      {/* Quiz questions (only when quiz exists and not yet submitted) */}
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
                        disabled={submitted || timeLeft === 0}
                      />
                      <span>{letter}. {opt}</span>
                    </label>
                  );
                })}
              </li>
            ))}
          </ul>

          <button
            onClick={() => handleSubmitQuiz({ auto: false })}
            disabled={loading}
            className={`mt-6 w-full py-2 font-semibold text-white rounded-lg transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Quiz"}
          </button>
        </div>
      )}

      {/* Results */}
      {submitted && resultData && (
        <div className="mt-6" id="quiz-results">
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
            onClick={handleDownloadPDF}
            className="mt-6 w-full py-2 font-semibold text-white rounded-lg bg-purple-600 hover:bg-purple-700"
          >
            📄 Download Results as PDF
          </button>

          <button
            onClick={() => {
              // Reset everything for a fresh quiz
              setQuiz([]);
              setAnswers({});
              setSubmitted(false);
              setScore(null);
              setResultData(null);
              setQuizId("");
              setTimerRunning(false);
              setTimeLeft(0);
            }}
            className="mt-4 w-full py-2 font-semibold text-white rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            🔄 Generate New Quiz
          </button>
        </div>
      )}
    </div>
  );
}
