const mongoose = require('mongoose');

// MongoDB stores references to Hippocampus namespaces
const hippoReferenceSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  hippoNamespace: {
    type: String,
    required: true,
    // e.g., "user_specific_john_doe"
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  knowledgeCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Update last accessed time
hippoReferenceSchema.methods.touch = function() {
  this.lastAccessed = new Date();
  return this.save();
};

// Static method to find or create Hippocampus reference
hippoReferenceSchema.statics.findOrCreate = async function(username) {
  let ref = await this.findOne({ username });
  if (!ref) {
    ref = await this.create({
      username,
      hippoNamespace: `user_specific_${username}`,
    });
  }
  return ref;
};

module.exports = mongoose.model('HippoReference', hippoReferenceSchema);
