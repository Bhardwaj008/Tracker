const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { recomputeMilestone, recomputeGoal } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

// PATCH /api/milestones/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'order'];
    const updates = {};
    for (const key of allowed) {
      if (req.body && req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const milestone = await Milestone.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/milestones/:id -> cascade tasks/subtasks
router.delete('/:id', async (req, res) => {
  try {
    const milestone = await Milestone.findOne({ _id: req.params.id, userId: req.userId });
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const tasks = await Task.find({ milestoneId: milestone._id }, '_id');
    const taskIds = tasks.map((t) => t._id);

    await Subtask.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ milestoneId: milestone._id });
    await Milestone.deleteOne({ _id: milestone._id });

    await recomputeGoal(milestone.goalId);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/milestones/:id/tasks
router.post('/:id/tasks', async (req, res) => {
  try {
    const milestone = await Milestone.findOne({ _id: req.params.id, userId: req.userId });
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const { title, weight, dueDate, notes } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const task = await Task.create({
      userId: req.userId,
      goalId: milestone.goalId,
      milestoneId: milestone._id,
      title,
      weight: weight || 'M',
      dueDate: dueDate || null,
      notes: notes || '',
    });

    await recomputeMilestone(milestone._id);
    await recomputeGoal(milestone.goalId);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
