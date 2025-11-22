const express = require('express');
const authMiddleware = require('../middleware/auth');
const Chat = require('../models/Chat');
const UserChat = require('../models/UserChat');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const router = express.Router();

// Simple responses for demo - you can integrate with AI later
const responses = [
  "Thank you for contacting customer service. How can I assist you today?",
  "I understand your concern. Let me help you with that.",
  "Could you please provide more details about your issue?",
  "I'm here to help! What specific problem are you experiencing?",
  "Let me look into that for you right away.",
  "Thank you for your patience. I'm checking on that now.",
  "Is there anything else I can help you with today?",
  "I appreciate you bringing this to our attention.",
  "Let me connect you with the right department for this issue.",
  "Thank you for choosing our service. How may I assist you?"
];

// Create new chat session
router.post('/new', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { title = 'New Chat' } = req.body;
    const chatId = uuidv4();

    // Create new chat document
    const newChat = new Chat({
      chatId: chatId,
      title: title,
      messages: [{
        id: 1,
        content: 'Hello! How can I help you today?',
        sender: 'bot',
        timestamp: new Date()
      }],
      messageCount: 1
    });

    await newChat.save();

    // Update user's chat mapping
    const userChat = await UserChat.findOrCreate(user.username);
    await userChat.addOrUpdateChat(chatId, title, 'Hello! How can I help you today?');

    res.json({
      success: true,
      chatId: chatId,
      message: 'New chat created successfully'
    });
  } catch (error) {
    console.error('Error creating new chat:', error);
    res.status(500).json({ 
      message: 'Error creating new chat', 
      error: error.message 
    });
  }
});

// Send message endpoint
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const user = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // Get existing chat
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add user message
    const userMessage = {
      id: chat.messageCount + 1,
      content: message.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    await chat.addMessage(userMessage);

    // Get conversation history for context (last 10 messages)
    const conversationHistory = chat.messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Generate bot response using AI agent
    let botResponse;
    try {
      const agentResponse = await axios.post(
        process.env.AI_AGENT_URL || 'http://localhost:8000/mongo-chat',
        {
          username: user.username,
          message: message.trim(),
          conversation_history: conversationHistory.slice(0, -1) // Exclude current message
        },
        { timeout: 60000 }
      );

      botResponse = agentResponse.data.response;
    } catch (agentError) {
      console.error('AI Agent error:', agentError.message);
      // Fallback to simple response if AI fails
      botResponse = "I'm having trouble processing your request right now. Please try again in a moment.";
    }

    const botMessage = {
      id: chat.messageCount + 1,
      content: botResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    await chat.addMessage(botMessage);

    // Update user's chat mapping (move to top)
    const userChat = await UserChat.findOrCreate(user.username);
    await userChat.addOrUpdateChat(chatId, chat.title, botMessage.content);

    res.json({
      success: true,
      response: botResponse,
      timestamp: botMessage.timestamp,
      chatId: chatId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Error processing message', 
      error: error.message 
    });
  }
});

// Get user's chat list (previous chats)
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    const userChat = await UserChat.findOne({ username: user.username });
    
    if (!userChat || !userChat.chats.length) {
      return res.json({
        success: true,
        chats: []
      });
    }

    // Get actual message counts from Chat collection
    const chatList = await Promise.all(userChat.chats.map(async (chat) => {
      const actualChat = await Chat.findOne({ chatId: chat.chatId });
      return {
        chatId: chat.chatId,
        title: chat.title,
        lastMessage: chat.lastMessage,
        messageCount: actualChat ? actualChat.messageCount : chat.messageCount,
        updatedAt: chat.lastUpdated
      };
    }));

    res.json({
      success: true,
      chats: chatList
    });
  } catch (error) {
    console.error('Error fetching chat list:', error);
    res.status(500).json({ 
      message: 'Error fetching chat list', 
      error: error.message 
    });
  }
});

// Get specific chat messages with pagination
router.get('/messages/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { offset = 0, limit = 24 } = req.query;
    const user = req.user;

    // Verify this chat belongs to the user
    const userChat = await UserChat.findOne({ username: user.username });
    if (!userChat || !userChat.chats.some(chat => chat.chatId === chatId)) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Get chat data from MongoDB
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Move chat to top in user's list (indicates user opened it)
    await userChat.moveToTop(chatId);

    // Calculate pagination
    const totalMessages = chat.messages.length;
    const startIndex = Math.max(0, totalMessages - parseInt(offset) - parseInt(limit));
    const endIndex = totalMessages - parseInt(offset);
    
    const paginatedMessages = chat.messages.slice(startIndex, endIndex);
    const hasMore = startIndex > 0;

    res.json({
      success: true,
      chat: {
        ...chat.toObject(),
        messages: paginatedMessages
      },
      pagination: {
        offset: parseInt(offset),
        limit: parseInt(limit),
        totalMessages: totalMessages,
        hasMore: hasMore
      }
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ 
      message: 'Error fetching chat messages', 
      error: error.message 
    });
  }
});

// Search within a specific chat
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { chatId, searchTerm } = req.body;
    const user = req.user;

    if (!searchTerm || searchTerm.trim().length === 0) {
      return res.status(400).json({ message: 'Search term cannot be empty' });
    }

    // Verify this chat belongs to the user
    const userChat = await UserChat.findOne({ username: user.username });
    if (!userChat || !userChat.chats.some(chat => chat.chatId === chatId)) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Get chat data from MongoDB
    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Search in chat messages
    const searchResults = chat.searchMessages(searchTerm.trim());

    res.json({
      success: true,
      searchTerm: searchTerm.trim(),
      results: searchResults,
      totalResults: searchResults.length
    });
  } catch (error) {
    console.error('Error searching chat:', error);
    res.status(500).json({ 
      message: 'Error searching chat', 
      error: error.message 
    });
  }
});

// Update chat title
router.put('/title/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const user = req.user;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ message: 'Title cannot be empty' });
    }

    // Verify this chat belongs to the user
    const userChat = await UserChat.findOne({ username: user.username });
    if (!userChat || !userChat.chats.some(chat => chat.chatId === chatId)) {
      return res.status(403).json({ message: 'Access denied to this chat' });
    }

    // Update title in both Chat and UserChat collections
    await Chat.updateOne({ chatId }, { title: title.trim() });
    await userChat.updateChatTitle(chatId, title.trim());

    res.json({
      success: true,
      message: 'Chat title updated successfully',
      title: title.trim()
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    res.status(500).json({ 
      message: 'Error updating chat title', 
      error: error.message 
    });
  }
});

// Delete a chat
router.delete('/delete/:chatId', authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const user = req.user;

    // Verify this chat belongs to the user and remove from user's chat list
    const userChat = await UserChat.findOne({ username: user.username });
    if (userChat) {
      await userChat.removeChat(chatId);
    }

    // Delete the actual chat document
    await Chat.deleteOne({ chatId });

    res.json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ 
      message: 'Error deleting chat', 
      error: error.message 
    });
  }
});

module.exports = router;