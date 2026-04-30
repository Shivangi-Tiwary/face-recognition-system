import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.scss';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "Hi! I'm your assistant. How can I help you?",
      suggestions: ["Face login", "Register face", "Help"],
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔥 DRAG STATE
  const [position, setPosition] = useState({
    x: window.innerWidth - 80,
    y: window.innerHeight - 80
  });

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ─── AUTO SCROLL ─────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── DRAG HANDLERS ───────────────
  const handleMouseDown = (e) => {
    dragging.current = true;
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;

    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y
    });
  };

  const handleMouseUp = () => {
    dragging.current = false;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // ─── SEND MESSAGE ────────────────
  const sendMessage = async (textOverride = null) => {
    const text = textOverride || inputMessage.trim();
    if (!text) return;

    const userMessage = {
      type: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      const botMessage = {
        type: 'bot',
        text: data.reply || "Something went wrong",
        suggestions: data.suggestions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          text: "Server error",
          suggestions: ["Try again", "Help"],
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div>

      {/* 🔥 DRAGGABLE BUTTON */}
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999
        }}
      >
        <button
          className="chat-toggle-btn"
          onMouseDown={handleMouseDown}
          onClick={toggleChat}
        >
          {isOpen ? "✖" : "💬"}
        </button>

        {/* CHAT WINDOW */}
        {isOpen && (
          <div className="chat-window">

            {/* HEADER */}
            <div className="chat-header">
              <span>Support</span>
              <button onClick={toggleChat}>✖</button>
            </div>

            {/* MESSAGES */}
            <div className="messages-container">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.type}`}>

                  {/* 🔥 IMPORTANT WRAPPER */}
                  <div className="message-content">

                    {/* BUBBLE */}
                    <div className="message-bubble">
                      {msg.text}
                    </div>

                    {/* SUGGESTIONS BELOW */}
                    {msg.type === "bot" && msg.suggestions?.length > 0 && (
                      <div className="suggestions">
                        {msg.suggestions.map((s, idx) => (
                          <button key={idx} onClick={() => sendMessage(s)}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message bot">
                  <div className="typing-indicator">...</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* INPUT */}
            <div className="chat-input-container">
              <input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type..."
              />
              <button onClick={() => sendMessage()}>➤</button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Chatbot;