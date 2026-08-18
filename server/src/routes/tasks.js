const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { recomputeMilestone, recomputeGoal, recomputeTask, applyCompletionChange } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

// PATCH /api/tasks/:id (+ triggers rollup)
router.patch('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const body = req.body || {};
    const allowed = ['title', 'weight', 'dueDate', 'notes'];
    for (const key of allowed) {
      if (body[key] !== undefined) task[key] = body[key];
    }

    // `completed` is only directly settable when the task has no subtasks;
    // when subtasks exist, completion is derived from them by the rollup
    // (see lib/rollup.js recomputeTask), so a direct flag here is ignored.
    if (body.completed !== undefined) {
      const subtaskCount = await Subtask.countDocuments({ taskId: task._id });
      if (subtaskCount === 0) {
        await applyCompletionChange(task, !!body.completed);
        task.progress = task.completed ? 100 : 0;
      }
    }

    await task.save();
    await recomputeMilestone(task.milestoneId);
    await recomputeGoal(task.goalId);

    const fresh = await Task.findById(task._id);
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id -> cascade subtasks
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await Subtask.deleteMany({ taskId: task._id });
    await Task.deleteOne({ _id: task._id });

    await recomputeMilestone(task.milestoneId);
    await recomputeGoal(task.goalId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/timer/start
router.post('/:id/timer/start', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // if another task for this user has a running timer, auto-stop it first
    const running = await Task.findOne({
      userId: req.userId,
      _id: { $ne: task._id },
      timerStartedAt: { $ne: null },
    });
    if (running) {
      const elapsedSec = Math.max(
        0,
        Math.round((Date.now() - running.timerStartedAt.getTime()) / 1000)
      );
      running.timeSpentSeconds += elapsedSec;
      running.timerStartedAt = null;
      await running.save();
    }

    task.timerStartedAt = new Date();
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/timer/stop
router.post('/:id/timer/stop', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    if (task.timerStartedAt) {
      const elapsedSec = Math.max(
        0,
        Math.round((Date.now() - task.timerStartedAt.getTime()) / 1000)
      );
      task.timeSpentSeconds += elapsedSec;
      task.timerStartedAt = null;
      await task.save();
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/subtasks
router.post('/:id/subtasks', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const subtask = await Subtask.create({
      userId: req.userId,
      taskId: task._id,
      title,
    });

    await recomputeTask(task._id);
    await recomputeMilestone(task.milestoneId);
    await recomputeGoal(task.goalId);

    res.status(201).json(subtask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
