const mongoose = require('mongoose');

// weight -> points map used for weighting rollups
const WEIGHT_POINTS = { S: 1, M: 2, L: 3, XL: 5 };

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
  subtopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtopic', required: true },
  title: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  weight: { type: String, enum: ['S', 'M', 'L', 'XL'], default: 'M' },
  dueDate: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  timeSpentSeconds: { type: Number, default: 0 },
  timerStartedAt: { type: Date, default: null },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

taskSchema.index({ userId: 1, dueDate: 1, completed: 1 });
taskSchema.index({ subtopicId: 1 });

taskSchema.statics.WEIGHT_POINTS = WEIGHT_POINTS;

module.exports = mongoose.model('Task', taskSchema);
module.exports.WEIGHT_POINTS = WEIGHT_POINTS;
