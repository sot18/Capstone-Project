import React, { useEffect, useRef, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function ChatBox() {
  const [user, setUser] = useState(null);
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [conversationName, setConversationName] = useState("New Conversation");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const auth = getAuth();

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, [auth]);

  // Load notes
  useEffect(() => {
    if (!user) return;
    fetch(`http://localhost:5001/api/notes?uid=${user.uid}`)
      .then(res => res.json())
      .then(data => {
        setNotes(data);
        if (data.length > 0) setSelectedNote(data[0].url);
      })
      .catch(err => console.error(err));
  }, [user]);

  // Load sessions
  const fetchSessions = () => {
    if (!user) return;
    fetch(`http://localhost:5001/api/sessions?uid=${user.uid}`)
      .then(res => res.json())
      .then(data => setSessions(Array.isArray(data) ? data : []))
      .catch(err => console.error("Error loading sessions:", err));
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  // Scroll to bottom when chat updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isTyping]);

  const startNewConversation = () => {
    setChat([]);
    setCurrentSessionId(null);
    setConversationName("New Conversation");
  };

  const loadSession = (session) => {
    const formatted = session.messages
      .map(m => [{ sender: "user", text: m.message }, { sender: "ai", text: m.reply }])
      .flat();
    setChat(formatted);
    setCurrentSessionId(session.sessionId);
    setConversationName(session.name || session.summary || "Conversation");
    if (session.note_url) setSelectedNote(session.note_url);
  };

  // ✅ Send message
  const handleSend = async () => {
    if (!message.trim() || !selectedNote) return;

    const userMsg = message.trim();
    setChat(prev => [...prev, { sender: "user", text: userMsg }]);
    setMessage(""); // Clear input immediately
    setIsTyping(true);

    try {
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          note_url: selectedNote,
          userId: user?.uid,
          sessionId: currentSessionId,
          conversationName
        }),
      });
      const data = await res.json();
      setChat(prev => [...prev, { sender: "ai", text: data.reply }]);
      setCurrentSessionId(data.sessionId);
      fetchSessions();
    } catch (err) {
      console.error("Chat error:", err);
      setChat(prev => [...prev, { sender: "ai", text: "Error: Could not connect to chatbot." }]);
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
    <div className="flex max-w-6xl mx-auto mt-10 gap-4">
      {/* Sessions sidebar */}
      <div className="w-64 bg-gray-100 p-4 rounded-lg overflow-y-auto h-[600px]">
        <div className="font-bold mb-2">Previous Conversations</div>
        <button
          onClick={startNewConversation}
          className="bg-blue-500 text-white px-2 py-1 rounded mb-2 w-full"
        >
          + New Conversation
        </button>
        {sessions.map((s, i) => (
          <div
            key={i}
            className="p-2 bg-white rounded mb-1 border cursor-pointer"
            onClick={() => loadSession(s)}
          >
            <div className="text-xs text-gray-500">{s.createdAt?.split("T")[0]}</div>
            <div className="font-semibold text-sm truncate">{s.name || s.summary}</div>
          </div>
        ))}
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg h-[600px]">
        {/* Conversation name input */}
        {currentSessionId === null && (
          <div className="p-4 flex items-center gap-2 border-b">
            <input
              type="text"
              value={conversationName}
              onChange={(e) => setConversationName(e.target.value)}
              placeholder="Enter conversation name..."
              className="flex-1 border rounded-lg p-2"
            />
          </div>
        )}

        {/* Note selector */}
        <div className="p-4 border-b flex items-center gap-3">
          <label className="text-sm font-semibold">Select Note</label>
          <select
            className="border rounded-md p-2 flex-1"
            value={selectedNote}
            onChange={e => setSelectedNote(e.target.value)}
          >
            {notes.map(n => (
              <option key={n.id} value={n.url}>{n.name}</option>
            ))}
          </select>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" data-testid="chat-container">
          {chat.map((m, i) => (
            <div
              key={i}
              data-testid={m.sender}
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

        {/* Input */}
        <div className="p-4 border-t flex gap-2">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 border rounded-lg p-2"
            data-testid="chat-input"
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || !selectedNote}
            className="bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            data-testid="send-button"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
