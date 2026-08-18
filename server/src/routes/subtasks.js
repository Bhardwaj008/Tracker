const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Subtask = require('../models/Subtask');
const Task = require('../models/Task');
const { recomputeTask, recomputeSubtopic, recomputeTopic, recomputeGoal } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

// PATCH /api/subtasks/:id (+ triggers rollup)
router.patch('/:id', async (req, res) => {
  try {
    const subtask = await Subtask.findOne({ _id: req.params.id, userId: req.userId });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const body = req.body || {};
    const allowed = ['title', 'completed'];
    for (const key of allowed) {
      if (body[key] !== undefined) subtask[key] = body[key];
    }
    await subtask.save();

    const task = await Task.findById(subtask.taskId);
    if (task) {
      await recomputeTask(task._id);
      await recomputeSubtopic(task.subtopicId);
      await recomputeTopic(task.topicId);
      await recomputeGoal(task.goalId);
    }

    res.json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/subtasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const subtask = await Subtask.findOne({ _id: req.params.id, userId: req.userId });
    if (!subtask) return res.status(404).json({ error: 'Subtask not found' });

    const task = await Task.findById(subtask.taskId);
    await Subtask.deleteOne({ _id: subtask._id });

    if (task) {
      await recomputeTask(task._id);
      await recomputeSubtopic(task.subtopicId);
      await recomputeTopic(task.topicId);
      await recomputeGoal(task.goalId);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
