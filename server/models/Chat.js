const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'bot']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'New Chat',
    trim: true
  },
  messages: [messageSchema],
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

chatSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.messageCount = this.messages.length;
  this.updatedAt = new Date();
  return this.save();
};

chatSchema.methods.searchMessages = function(searchTerm) {
  if (!searchTerm) return [];
  
  const normalizedTerm = searchTerm.toLowerCase();
  const results = [];
  
  this.messages.forEach((message, index) => {
    if (message.content && message.content.toLowerCase().includes(normalizedTerm)) {
      results.push({
        ...message.toObject(),
        messageIndex: index,
        snippet: this.highlightMatch(message.content, searchTerm)
      });
    }
  });
  
  return results;
};

chatSchema.methods.highlightMatch = function(text, searchTerm) {
  if (!text || !searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '**$1**');
};

module.exports = mongoose.model('Chat', chatSchema, 'Chats');