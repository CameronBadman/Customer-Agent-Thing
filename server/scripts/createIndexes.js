require('dotenv').config();
const mongoose = require('mongoose');

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create text indexes for search functionality
    console.log('Creating text index for baseknowledges...');
    await db.collection('baseknowledges').createIndex({
      title: 'text',
      content: 'text',
      tags: 'text'
    });

    console.log('Creating text index for completedissues...');
    await db.collection('completedissues').createIndex({
      issueTitle: 'text',
      issueDescription: 'text',
      symptoms: 'text',
      tags: 'text'
    });

    console.log('✓ All indexes created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  }
}

createIndexes();
