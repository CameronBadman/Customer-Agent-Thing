const express = require('express');
const authMiddleware = require('../middleware/auth');

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

// Send message endpoint
router.post('/message', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    const user = req.user;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Log the message (you can save to database later)
    console.log(`Message from ${user.username} (${user.email}): ${message}`);

    // Generate a simple response (you can integrate with AI service here)
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    res.json({
      success: true,
      response: randomResponse,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      message: 'Error processing message', 
      error: error.message 
    });
  }
});

module.exports = router;