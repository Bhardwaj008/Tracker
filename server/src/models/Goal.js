const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  archived: { type: Boolean, default: false },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
});

goalSchema.index({ userId: 1, archived: 1 });

module.exports = mongoose.model('Goal', goalSchema);
