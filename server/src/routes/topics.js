const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Topic = require('../models/Topic');
const Subtopic = require('../models/Subtopic');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { recomputeGoal } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

// PATCH /api/topics/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'order'];
    const updates = {};
    for (const key of allowed) {
      if (req.body && req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const topic = await Topic.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/topics/:id -> cascade subtopics + the tasks/subtasks under them
router.delete('/:id', async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.userId });
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const subtopics = await Subtopic.find({ topicId: topic._id }, '_id');
    const subtopicIds = subtopics.map((s) => s._id);

    const tasks = await Task.find({ subtopicId: { $in: subtopicIds } }, '_id');
    const taskIds = tasks.map((t) => t._id);

    await Subtask.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ subtopicId: { $in: subtopicIds } });
    await Subtopic.deleteMany({ topicId: topic._id });
    await Topic.deleteOne({ _id: topic._id });

    await recomputeGoal(topic.goalId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/topics/:id/subtopics
router.post('/:id/subtopics', async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.userId });
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const { title, order } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const subtopic = await Subtopic.create({
      userId: req.userId,
      goalId: topic.goalId,
      topicId: topic._id,
      title,
      order: order ?? 0,
    });
    res.status(201).json(subtopic);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
