const express = require('express');
const router = express.Router();
const BaseKnowledge = require('../models/BaseKnowledge');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// All admin routes require authentication and admin role
router.use(auth);
router.use(adminAuth);

// Get all base knowledge entries
router.get('/base-knowledge', async (req, res) => {
  try {
    const knowledge = await BaseKnowledge.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 });
    res.json(knowledge);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single base knowledge entry
router.get('/base-knowledge/:id', async (req, res) => {
  try {
    const knowledge = await BaseKnowledge.findById(req.params.id);
    if (!knowledge) {
      return res.status(404).json({ message: 'Knowledge entry not found' });
    }
    res.json(knowledge);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new base knowledge entry
router.post('/base-knowledge', async (req, res) => {
  try {
    const { title, content, category, tags, priority } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    const knowledge = new BaseKnowledge({
      title,
      content,
      category,
      tags: tags || [],
      priority: priority || 1,
      createdBy: req.user.username,
    });

    await knowledge.save();
    res.status(201).json({ message: 'Base knowledge created', knowledge });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update base knowledge entry
router.put('/base-knowledge/:id', async (req, res) => {
  try {
    const { title, content, category, tags, priority, isActive } = req.body;

    const knowledge = await BaseKnowledge.findById(req.params.id);
    if (!knowledge) {
      return res.status(404).json({ message: 'Knowledge entry not found' });
    }

    if (title) knowledge.title = title;
    if (content) knowledge.content = content;
    if (category) knowledge.category = category;
    if (tags) knowledge.tags = tags;
    if (priority !== undefined) knowledge.priority = priority;
    if (isActive !== undefined) knowledge.isActive = isActive;

    await knowledge.save();
    res.json({ message: 'Base knowledge updated', knowledge });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete base knowledge entry (soft delete)
router.delete('/base-knowledge/:id', async (req, res) => {
  try {
    const knowledge = await BaseKnowledge.findById(req.params.id);
    if (!knowledge) {
      return res.status(404).json({ message: 'Knowledge entry not found' });
    }

    knowledge.isActive = false;
    await knowledge.save();
    res.json({ message: 'Base knowledge deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search base knowledge
router.get('/base-knowledge/search/:query', async (req, res) => {
  try {
    const knowledge = await BaseKnowledge.find({
      $text: { $search: req.params.query },
      isActive: true,
    }).sort({ score: { $meta: 'textScore' } });

    res.json(knowledge);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
