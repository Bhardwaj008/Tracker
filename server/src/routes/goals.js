const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const { computeGoalStatus } = require('../lib/rollup');

const router = express.Router();
router.use(requireAuth);

function shapeGoal(goalDoc) {
  const g = goalDoc.toObject ? goalDoc.toObject() : goalDoc;
  const { status, daysRemaining, dailyTargetPct } = computeGoalStatus(g);
  return { ...g, status, daysRemaining, dailyTargetPct };
}

// GET /api/goals?archived=false
router.get('/', async (req, res) => {
  try {
    const filter = { userId: req.userId };
    if (req.query.archived !== undefined) {
      filter.archived = req.query.archived === 'true';
    }
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json(goals.map(shapeGoal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals
router.post('/', async (req, res) => {
  try {
    const { title, description, startDate, dueDate } = req.body || {};
    if (!title || !startDate || !dueDate) {
      return res.status(400).json({ error: 'title, startDate, and dueDate are required' });
    }
    const goal = await Goal.create({
      userId: req.userId,
      title,
      description: description || '',
      startDate,
      dueDate,
    });
    res.status(201).json(shapeGoal(goal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/goals/:id -> full tree in one call
router.get('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestones = await Milestone.find({ goalId: goal._id, userId: req.userId })
      .sort({ order: 1 })
      .lean();

    const tasks = await Task.find({ goalId: goal._id, userId: req.userId })
      .sort({ order: 1 })
      .lean();

    const taskIds = tasks.map((t) => t._id);
    const subtasks = await Subtask.find({ taskId: { $in: taskIds } })
      .sort({ order: 1 })
      .lean();

    const subtasksByTask = new Map();
    for (const st of subtasks) {
      const key = String(st.taskId);
      if (!subtasksByTask.has(key)) subtasksByTask.set(key, []);
      subtasksByTask.get(key).push(st);
    }

    const tasksByMilestone = new Map();
    for (const t of tasks) {
      const key = String(t.milestoneId);
      const shapedTask = { ...t, subtasks: subtasksByTask.get(String(t._id)) || [] };
      if (!tasksByMilestone.has(key)) tasksByMilestone.set(key, []);
      tasksByMilestone.get(key).push(shapedTask);
    }

    const shapedMilestones = milestones.map((m) => ({
      ...m,
      tasks: tasksByMilestone.get(String(m._id)) || [],
    }));

    res.json({ goal: shapeGoal(goal), milestones: shapedMilestones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/goals/:id
router.patch('/:id', async (req, res) => {
  try {
    const allowed = ['title', 'description', 'startDate', 'dueDate', 'archived'];
    const updates = {};
    for (const key of allowed) {
      if (req.body && req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true }
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json(shapeGoal(goal));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/goals/:id -> cascade milestones/tasks/subtasks
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const tasks = await Task.find({ goalId: goal._id }, '_id');
    const taskIds = tasks.map((t) => t._id);

    await Subtask.deleteMany({ taskId: { $in: taskIds } });
    await Task.deleteMany({ goalId: goal._id });
    await Milestone.deleteMany({ goalId: goal._id });
    await Goal.deleteOne({ _id: goal._id });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/goals/:id/milestones
router.post('/:id/milestones', async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const { title, order } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const milestone = await Milestone.create({
      userId: req.userId,
      goalId: goal._id,
      title,
      order: order ?? 0,
    });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
