import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from './ChatSidebar';
import SearchBar from './SearchBar';
import './Chat.css';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { user, logout, sendMessage, createNewChat, getChatMessages } = useAuth();
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

  const handleNewChat = async () => {
    try {
      const response = await createNewChat('New Chat');
      setCurrentChatId(response.chatId);
      setMessages([
        {
          id: 1,
          content: 'Hello! How can I help you today?',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setSearchResults([]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const handleChatSelect = async (chatId) => {
    if (!chatId) {
      setCurrentChatId(null);
      setMessages([]);
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await getChatMessages(chatId);
      setCurrentChatId(chatId);
      setMessages(response.chat.messages || []);
      setSearchResults([]);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error loading chat:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || loading) return;

    // If no current chat, create a new one
    if (!currentChatId) {
      await handleNewChat();
      return;
    }

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
      const response = await sendMessage(userMessage.content, currentChatId);
      
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

  const handleSearchResults = (results) => {
    setSearchResults(results);
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
    <div className="chat-layout">
      <ChatSidebar
        currentChatId={currentChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />
      
      <div className="chat-main">
        <div className="chat-container">
          <div className="chat-header">
            <div className="header-left">
              <button 
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                ☰
              </button>
              <h2>Customer Service Chat</h2>
            </div>
            <div className="user-info">
              <span>Welcome, {user.username}</span>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </div>
          </div>

          <SearchBar 
            currentChatId={currentChatId}
            onSearchResults={handleSearchResults}
          />

          <div className="chat-messages">
            {loading && messages.length === 0 ? (
              <div className="loading-messages">Loading chat...</div>
            ) : (
              <>
                {messages.length === 0 && !currentChatId && (
                  <div className="welcome-message">
                    <h3>Welcome to Customer Service!</h3>
                    <p>Start a new chat or select a previous conversation from the sidebar.</p>
                    <button onClick={handleNewChat} className="start-chat-btn">
                      Start New Chat
                    </button>
                  </div>
                )}
                
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
              </>
            )}
          </div>

          <div className="chat-input-container">
            <form onSubmit={handleSendMessage} className="chat-input-wrapper">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={currentChatId ? "Type your message..." : "Start a new chat..."}
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
      </div>
    </div>
  );
};

export default Chat;