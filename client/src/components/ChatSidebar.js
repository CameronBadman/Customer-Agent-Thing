import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ChatSidebar.css';

const ChatSidebar = ({ currentChatId, onChatSelect, onNewChat }) => {
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { getChatList, deleteChat } = useAuth();

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getChatList();
      setChatList(response.chats || []);
    } catch (error) {
      setError('Failed to load chats');
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [getChatList]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this chat?')) {
      try {
        await deleteChat(chatId);
        setChatList(prevList => prevList.filter(chat => chat.chatId !== chatId));
        
        // If deleted chat was current, clear current chat
        if (currentChatId === chatId) {
          onChatSelect(null);
        }
      } catch (error) {
        setError('Failed to delete chat');
        console.error('Error deleting chat:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateMessage = (message, maxLength = 50) => {
    if (!message || message.length <= maxLength) {
      return message;
    }
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Previous Chats</h3>
          <button className="new-chat-btn" onClick={onNewChat}>
            + New Chat
          </button>
        </div>
        <div className="loading-container">
          <div>Loading chats...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Previous Chats</h3>
        <button className="new-chat-btn" onClick={onNewChat}>
          + New Chat
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchChats} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="chat-list">
        {chatList.length === 0 ? (
          <div className="empty-state">
            <p>No previous chats</p>
            <p>Start a new conversation!</p>
          </div>
        ) : (
          chatList.map((chat) => (
            <div
              key={chat.chatId}
              className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
              onClick={() => onChatSelect(chat.chatId)}
            >
              <div className="chat-item-header">
                <h4 className="chat-title">{chat.title}</h4>
                <button
                  className="delete-chat-btn"
                  onClick={(e) => handleDeleteChat(chat.chatId, e)}
                  title="Delete chat"
                >
                  ×
                </button>
              </div>
              
              <p className="last-message">
                {truncateMessage(chat.lastMessage)}
              </p>
              
              <div className="chat-meta">
                <span className="message-count">
                  {chat.messageCount} messages
                </span>
                <span className="chat-date">
                  {formatDate(chat.updatedAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;