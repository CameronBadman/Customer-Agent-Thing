import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, logout, sendMessage } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      content: messageInput.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessageInput('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await sendMessage(userMessage.content);
      
      setIsTyping(false);
      
      const botMessage = {
        id: Date.now() + 1,
        content: response.response,
        sender: 'bot',
        timestamp: new Date(response.timestamp),
      };

      setTimeout(() => {
        setMessages((prev) => [...prev, botMessage]);
      }, 500);
    } catch (error) {
      setIsTyping(false);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Customer Service Chat</h2>
        <div className="user-info">
          <span>Welcome, {user.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender}-message`}
          >
            <div className="message-content">
              {message.sender === 'bot' && (
                <strong>Customer Service: </strong>
              )}
              {message.content}
            </div>
            <div className="message-time">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot-message typing">
            <div className="message-content">
              <strong>Customer Service: </strong>
              <span className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <form onSubmit={handleSendMessage} className="chat-input-wrapper">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            maxLength="500"
            disabled={loading}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!messageInput.trim() || loading}
            className="send-btn"
          >
            Send
          </button>
        </form>

        <div className="chat-status">
          <span className="status-indicator online"></span>
          <span>Customer Service Online</span>
        </div>
      </div>
    </div>
  );
};

export default Chat;