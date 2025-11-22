const express = require('express');
const authMiddleware = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Get AI Agent API URL from environment
const AI_AGENT_URL = process.env.AI_AGENT_URL || 'http://localhost:8000';

// Add knowledge to base store
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { category, information } = req.body;

    if (!category || !information) {
      return res.status(400).json({
        error: 'Category and information are required'
      });
    }

    // Forward request to Python AI Agent API
    const response = await axios.post(`${AI_AGENT_URL}/curator/add`, {
      category,
      information
    }, {
      timeout: 30000 // 30 second timeout for LLM processing
    });

    res.json(response.data);

  } catch (error) {
    console.error('Curator add error:', error.message);

    if (error.response) {
      // Forward error from Python API
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'AI Agent service unavailable. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Failed to add knowledge to base store'
      });
    }
  }
});

// Search base knowledge
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        error: 'Query is required'
      });
    }

    // Forward request to Python AI Agent API
    const response = await axios.post(`${AI_AGENT_URL}/curator/search`, {
      query,
      limit
    });

    res.json(response.data);

  } catch (error) {
    console.error('Curator search error:', error.message);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'AI Agent service unavailable. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Failed to search base knowledge'
      });
    }
  }
});

// List all base knowledge
router.get('/list', authMiddleware, async (req, res) => {
  try {
    // Forward request to Python AI Agent API
    const response = await axios.get(`${AI_AGENT_URL}/curator/list`);

    res.json(response.data);

  } catch (error) {
    console.error('Curator list error:', error.message);

    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'AI Agent service unavailable. Please try again later.'
      });
    } else {
      res.status(500).json({
        error: 'Failed to list base knowledge'
      });
    }
  }
});

module.exports = router;
