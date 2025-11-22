const mongoose = require('mongoose');

const baseKnowledgeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['policy', 'procedure', 'guide', 'escalation', 'general'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  createdBy: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for faster searches
baseKnowledgeSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('BaseKnowledge', baseKnowledgeSchema);
