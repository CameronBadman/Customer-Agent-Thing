const mongoose = require('mongoose');

const completedIssueSchema = new mongoose.Schema({
  issueTitle: {
    type: String,
    required: true,
  },
  issueDescription: {
    type: String,
    required: true,
  },
  symptoms: [{
    type: String,
  }],
  solutionSteps: {
    type: String,
    required: true,
  },
  context: {
    type: String,
  },
  category: {
    type: String,
    enum: ['hardware', 'software', 'network', 'access', 'other'],
    required: true,
  },
  tags: [{
    type: String,
  }],
  userEnvironment: {
    type: String,
  },
  effectiveness: {
    type: Number,
    min: 1,
    max: 5,
  },
  reportedBy: {
    type: String,
  },
  resolvedAt: {
    type: Date,
    default: Date.now,
  },
  timeTaken: {
    type: Number, // minutes
  },
  relatedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CompletedIssue',
  }],
}, {
  timestamps: true,
});

// Index for faster searches
completedIssueSchema.index({ issueTitle: 'text', issueDescription: 'text', symptoms: 'text', tags: 'text' });

module.exports = mongoose.model('CompletedIssue', completedIssueSchema);
