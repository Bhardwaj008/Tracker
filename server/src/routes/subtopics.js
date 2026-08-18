const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Subtopic = require('../models/Subtopic');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { recomputeSubtopic, recomputeTopic, recomputeGoal } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

// PATCH /api/subtopics/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'order'];
    const updates = {};
    for (const key of allowed) {
      if (req.body && req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const subtopic = await Subtopic.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!subtopic) return res.status(404).json({ error: 'Subtopic not found' });
    res.json(subtopic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subtopics/:id -> cascade tasks/subtasks
router.delete('/:id', async (req, res) => {
  try {
    const subtopic = await Subtopic.findOne({ _id: req.params.id, userId: req.userId });
    if (!subtopic) return res.status(404).json({ error: 'Subtopic not found' });

    const tasks = await Task.find({ subtopicId: subtopic._id }, '_id');
    const taskIds = tasks.map((t) => t._id);

    await Subtask.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ subtopicId: subtopic._id });
    await Subtopic.deleteOne({ _id: subtopic._id });

    await recomputeTopic(subtopic.topicId);
    await recomputeGoal(subtopic.goalId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/subtopics/:id/tasks
router.post('/:id/tasks', async (req, res) => {
  try {
    const subtopic = await Subtopic.findOne({ _id: req.params.id, userId: req.userId });
    if (!subtopic) return res.status(404).json({ error: 'Subtopic not found' });

    const { title, weight, dueDate, notes } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const task = await Task.create({
      userId: req.userId,
      goalId: subtopic.goalId,
      topicId: subtopic.topicId,
      subtopicId: subtopic._id,
      title,
      weight: weight || 'M',
      dueDate: dueDate || null,
      notes: notes || '',
    });

    await recomputeSubtopic(subtopic._id);
    await recomputeTopic(subtopic.topicId);
    await recomputeGoal(subtopic.goalId);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
