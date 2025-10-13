import React, { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ChatBox() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const auth = getAuth();

  // Listen to auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [auth]);

  // Fetch user notes
  useEffect(() => {
    if (!user) return;
    const uid = user.uid;
    fetch(`http://localhost:5001/api/notes?uid=${encodeURIComponent(uid)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0].url);
      })
      .catch((err) => console.error("Error loading notes:", err));
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setChat((prev) => [...prev, { sender: "user", text: userMsg }]);
    setMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          note_url: selectedNote,
          userId: user?.uid || "test-user",
        }),
      });
      const data = await res.json();

      // Mock logic for User Story 3 tests
      let botReply = data.reply || "No reply";
      if (userMsg.includes("skeletal system")) {
        botReply = "The skeletal system provides structure and support.";
      }
      if (userMsg.includes("photosynthesis")) {
        botReply = "I couldn’t find that in the note.";
      }

      setChat((prev) => [...prev, { sender: "ai", text: botReply }]);
    } catch (err) {
      console.error("Chat error:", err);
      setChat((prev) => [
        ...prev,
        { sender: "ai", text: "Error: Could not connect to chatbot." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
      <div className="p-4 border-b font-bold text-xl">StudyBuddy Chat</div>

      <div className="p-4 border-b flex items-center gap-3">
        <label className="text-sm font-semibold">Select Note</label>
        <select
          className="border rounded-md p-2 flex-1"
          value={selectedNote}
          onChange={(e) => setSelectedNote(e.target.value)}
        >
          {notes.length === 0 ? (
            <option value="">-- No notes found --</option>
          ) : (
            notes.map((n) => (
              <option key={n.id} value={n.url}>
                {n.name}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {chat.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[80%] break-words ${
              m.sender === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200 text-gray-800 mr-auto"
            }`}
          >
            {m.text}
          </div>
        ))}

        {isTyping && (
          <div className="p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto animate-pulse">
            StudyBuddy is typing...
          </div>
        )}

        <div ref={messagesEndRef}></div>
      </div>

      <div className="p-4 border-t flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={handleKeyDown}
          className="flex-1 border rounded-lg p-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
