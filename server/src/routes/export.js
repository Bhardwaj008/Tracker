const express = require('express');
const { requireAuth } = require('../middleware/auth');
const User = require('../models/User');
const Goal = require('../models/Goal');
const Milestone = require('../models/Milestone');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Activity = require('../models/Activity');

const router = express.Router();
router.use(requireAuth);

// GET /api/export -> full JSON dump of everything for req.userId, for backup
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const [user, goals, milestones, tasks, subtasks, activity] = await Promise.all([
      User.findById(userId, '-passwordHash').lean(),
      Goal.find({ userId }).lean(),
      Milestone.find({ userId }).lean(),
      Task.find({ userId }).lean(),
      Subtask.find({ userId }).lean(),
      Activity.find({ userId }).lean(),
    ]);

    res.json({
      exportedAt: new Date().toISOString(),
      user,
      goals,
      milestones,
      tasks,
      subtasks,
      activity,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
