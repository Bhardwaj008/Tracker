const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

subtaskSchema.index({ taskId: 1 });

module.exports = mongoose.model('Subtask', subtaskSchema);
