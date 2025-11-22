const mongoose = require('mongoose');

const userChatSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  chats: [{
    chatId: {
      type: String,
      required: true,
      ref: 'Chat'
    },
    title: {
      type: String,
      default: 'New Chat'
    },
    lastMessage: {
      type: String,
      default: ''
    },
    messageCount: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Method to add or update a chat for the user
userChatSchema.methods.addOrUpdateChat = function(chatId, title = 'New Chat', lastMessage = '') {
  const existingIndex = this.chats.findIndex(chat => chat.chatId === chatId);
  
  if (existingIndex > -1) {
    // Update existing chat and move to top
    this.chats[existingIndex].lastMessage = lastMessage;
    this.chats[existingIndex].lastUpdated = new Date();
    this.chats[existingIndex].messageCount += 1;
    
    const chat = this.chats.splice(existingIndex, 1)[0];
    this.chats.unshift(chat);
  } else {
    // Add new chat at the top
    this.chats.unshift({
      chatId: chatId,
      title: title,
      lastMessage: lastMessage,
      messageCount: 1,
      lastUpdated: new Date()
    });
  }
  
  return this.save();
};

// Method to remove a chat
userChatSchema.methods.removeChat = function(chatId) {
  this.chats = this.chats.filter(chat => chat.chatId !== chatId);
  return this.save();
};

// Method to reorder chat to top (when user opens it)
userChatSchema.methods.moveToTop = function(chatId) {
  const chatIndex = this.chats.findIndex(chat => chat.chatId === chatId);
  if (chatIndex > -1) {
    const chat = this.chats.splice(chatIndex, 1)[0];
    chat.lastUpdated = new Date();
    this.chats.unshift(chat);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static method to find or create user chat document
userChatSchema.statics.findOrCreate = async function(username) {
  let userChat = await this.findOne({ username });
  if (!userChat) {
    userChat = new this({ username, chats: [] });
    await userChat.save();
  }
  return userChat;
};

module.exports = mongoose.model('UserChat', userChatSchema, 'User-Chat');