const mongoose = require('mongoose');

const subtopicSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  title: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

subtopicSchema.index({ topicId: 1 });

module.exports = mongoose.model('Subtopic', subtopicSchema);
