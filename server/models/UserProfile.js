const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  systemInfo: {
    os: String,
    osVersion: String,
    hardware: [String],
    software: [String],
    peripherals: [String],
  },
  preferences: {
    communicationStyle: {
      type: String,
      enum: ['detailed', 'concise', 'visual'],
      default: 'detailed',
    },
    technicalLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },
    preferredContactMethod: String,
  },
  commonIssues: [{
    issue: String,
    frequency: {
      type: Number,
      default: 1,
    },
    lastOccurrence: Date,
  }],
  pastTickets: [{
    ticketId: String,
    date: Date,
    issueType: String,
    resolved: Boolean,
  }],
  notes: String,
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Method to add or increment a common issue
userProfileSchema.methods.recordIssue = function(issue) {
  const existingIssue = this.commonIssues.find(i => i.issue === issue);
  if (existingIssue) {
    existingIssue.frequency += 1;
    existingIssue.lastOccurrence = new Date();
  } else {
    this.commonIssues.push({
      issue,
      frequency: 1,
      lastOccurrence: new Date(),
    });
  }
  this.lastUpdated = new Date();
};

// Static method to find or create profile
userProfileSchema.statics.findOrCreate = async function(username) {
  let profile = await this.findOne({ username });
  if (!profile) {
    profile = await this.create({ username });
  }
  return profile;
};

module.exports = mongoose.model('UserProfile', userProfileSchema);
