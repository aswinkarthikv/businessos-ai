import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your AI Business Assistant. I have live access to your ERP database. Ask me about low stock items, sales, or generating reports!"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const quickPrompts = [
    "Which products are low in stock?",
    "Show this month's sales summary",
    "How can I improve retention?",
    "Tell me about customer churn"
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response || "I'm sorry, I couldn't retrieve a response. Please try again."
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Connection failed. Please ensure your backend server is running."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button className="chat-toggle" onClick={() => setIsOpen(true)}>
          <MessageSquare size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget glass-card">
          <div className="chat-header">
            <div className="chat-title-info">
              <Bot size={20} className="ticker-icon" />
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700' }}>AI Assistant</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span className="chat-dot"></span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Online</span>
                </div>
              </div>
            </div>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="chat-body">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="chat-msg bot" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span className="chat-dot" style={{ animation: 'pulse-danger 1s infinite' }}></span>
                <span>AI is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="chat-quick-replies">
            {quickPrompts.map((prompt, idx) => (
              <button 
                key={idx} 
                className="quick-reply-btn"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form 
            className="chat-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Ask anything..."
              className="chat-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '10px', borderRadius: '8px', minWidth: '40px' }}
              disabled={isLoading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
