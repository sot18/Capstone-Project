import React, { useState, useRef, useEffect } from "react";

const ChatBox = () => {
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, newMessage]);
    setUserInput(""); // clear input field

    setIsTyping(true);
    try {
      const response = await fetch("http://127.0.0.1:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();
      const botMessage = { sender: "bot", text: data.reply };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with AI chatbot:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error: Could not connect to chatbot." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Send message on Enter
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
      <div className="p-4 border-b font-bold text-xl">StudyBuddy Chat</div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg max-w-[80%] break-words ${
              msg.sender === "user"
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200 text-gray-800 mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {isTyping && (
          <div className="p-3 rounded-lg bg-gray-200 text-gray-800 mr-auto animate-pulse">
            StudyBuddy is typing...
          </div>
        )}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t flex gap-2">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 border rounded-lg p-2 resize-none h-12 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
};

export default ChatBox;
