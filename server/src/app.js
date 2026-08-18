const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const todayRoutes = require('./routes/today');
const goalsRoutes = require('./routes/goals');
const topicsRoutes = require('./routes/topics');
const subtopicsRoutes = require('./routes/subtopics');
const tasksRoutes = require('./routes/tasks');
const subtasksRoutes = require('./routes/subtasks');
const exportRoutes = require('./routes/export');

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/today', todayRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/subtopics', subtopicsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/subtasks', subtasksRoutes);
app.use('/api/export', exportRoutes);

// 404 for anything unmatched under /api (and otherwise)
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Centralized error handler - anything thrown/rejected in a route that isn't
// already caught lands here as a 500 with the contract's { error } shape.
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
