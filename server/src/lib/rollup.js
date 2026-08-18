const mongoose = require('mongoose');
const Task = require('../models/Task');
const Subtask = require('../models/Subtask');
const Milestone = require('../models/Milestone');
const Goal = require('../models/Goal');
const Activity = require('../models/Activity');

const WEIGHT_POINTS = Task.WEIGHT_POINTS; // { S:1, M:2, L:3, XL:5 }

// A $switch branch list mapping Task.weight -> points, reused by both
// aggregation pipelines below.
const WEIGHT_SWITCH = {
  branches: [
    { case: { $eq: ['$weight', 'S'] }, then: WEIGHT_POINTS.S },
    { case: { $eq: ['$weight', 'M'] }, then: WEIGHT_POINTS.M },
    { case: { $eq: ['$weight', 'L'] }, then: WEIGHT_POINTS.L },
    { case: { $eq: ['$weight', 'XL'] }, then: WEIGHT_POINTS.XL },
  ],
  default: WEIGHT_POINTS.M,
};

/** 'YYYY-MM-DD' for a given Date (defaults to now), used as the Activity key. */
function todayStr(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Nudges the Activity{userId, date} counter for "today" up or down.
 * delta > 0 upserts+increments; delta < 0 decrements but never below 0.
 */
async function bumpActivity(userId, delta) {
  const date = todayStr();
  if (delta > 0) {
    await Activity.findOneAndUpdate(
      { userId, date },
      { $inc: { count: delta } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } else if (delta < 0) {
    const doc = await Activity.findOne({ userId, date });
    if (doc && doc.count > 0) {
      doc.count = Math.max(0, doc.count + delta);
      await doc.save();
    }
  }
}

/**
 * Applies a completed-state flip to a task (in memory - caller still needs to
 * .save()), keeping completedAt and the Activity/streak counters consistent:
 *  - false -> true: stamp completedAt=now, +1 today's Activity count.
 *  - true -> false: -1 today's Activity count, but ONLY if the task was
 *    completed earlier the same calendar day (undoing a completion from a
 *    previous day must not rewrite that day's history).
 *  - no-op if the boolean doesn't actually change.
 */
async function applyCompletionChange(task, newCompleted) {
  const wasCompleted = task.completed;
  if (!wasCompleted && newCompleted) {
    task.completed = true;
    task.completedAt = new Date();
    await bumpActivity(task.userId, 1);
  } else if (wasCompleted && !newCompleted) {
    const completedOnDate = task.completedAt ? todayStr(task.completedAt) : null;
    if (completedOnDate === todayStr()) {
      await bumpActivity(task.userId, -1);
    }
    task.completed = false;
    task.completedAt = null;
  }
  return task;
}

/**
 * Recomputes a single Task's cached `progress` (and derived `completed`)
 * from its Subtasks via an aggregation pipeline:
 *   - has subtasks -> progress = round(100 * completedSubtasks / totalSubtasks);
 *     completed is auto-derived (true only at 100%).
 *   - no subtasks -> progress is binary (0/100) driven by whatever `completed`
 *     was already set to (e.g. by a direct PATCH /tasks/:id).
 */
async function recomputeTask(taskId) {
  const task = await Task.findById(taskId);
  if (!task) return null;

  const [agg] = await Subtask.aggregate([
    { $match: { taskId: task._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completedCount: { $sum: { $cond: ['$completed', 1, 0] } },
      },
    },
  ]);

  if (agg && agg.total > 0) {
    const progress = Math.round((100 * agg.completedCount) / agg.total);
    task.progress = progress;
    await applyCompletionChange(task, progress === 100);
  } else {
    task.progress = task.completed ? 100 : 0;
  }

  await task.save();
  return task;
}

/**
 * Milestone.progress = weighted average of its Tasks' progress, weight =
 * the task's weight->points value. Computed via aggregation ($group with
 * weighted $sum) rather than pulling tasks into Node and reducing in JS.
 */
async function recomputeMilestone(milestoneId) {
  const [agg] = await Task.aggregate([
    { $match: { milestoneId: new mongoose.Types.ObjectId(milestoneId) } },
    {
      $project: {
        progress: 1,
        points: { $switch: WEIGHT_SWITCH },
      },
    },
    {
      $group: {
        _id: null,
        weightedSum: { $sum: { $multiply: ['$progress', '$points'] } },
        totalPoints: { $sum: '$points' },
      },
    },
  ]);

  const progress = agg && agg.totalPoints > 0 ? Math.round(agg.weightedSum / agg.totalPoints) : 0;
  return Milestone.findByIdAndUpdate(milestoneId, { progress }, { new: true });
}

/**
 * Goal.progress = average of its Milestones' progress, weight = the sum of
 * points of the tasks under that milestone (heavier/more-populated
 * milestones count more). Uses $lookup + $group so the whole rollup happens
 * inside Mongo.
 */
async function recomputeGoal(goalId) {
  const rows = await Milestone.aggregate([
    { $match: { goalId: new mongoose.Types.ObjectId(goalId) } },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'milestoneId',
        as: 'tasks',
      },
    },
    {
      $project: {
        progress: 1,
        milestoneWeight: {
          $sum: {
            $map: {
              input: '$tasks',
              as: 't',
              in: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$$t.weight', 'S'] }, then: WEIGHT_POINTS.S },
                    { case: { $eq: ['$$t.weight', 'M'] }, then: WEIGHT_POINTS.M },
                    { case: { $eq: ['$$t.weight', 'L'] }, then: WEIGHT_POINTS.L },
                    { case: { $eq: ['$$t.weight', 'XL'] }, then: WEIGHT_POINTS.XL },
                  ],
                  default: WEIGHT_POINTS.M,
                },
              },
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        weightedSum: { $sum: { $multiply: ['$progress', '$milestoneWeight'] } },
        totalWeight: { $sum: '$milestoneWeight' },
      },
    },
  ]);

  const row = rows[0];
  const progress = row && row.totalWeight > 0 ? Math.round(row.weightedSum / row.totalWeight) : 0;
  return Goal.findByIdAndUpdate(goalId, { progress }, { new: true });
}

/**
 * On-track/behind + daily target, computed on read (never persisted):
 *   elapsedFraction = clamp((today - startDate) / (dueDate - startDate), 0, 1)
 *   status = progress/100 >= elapsedFraction - 0.05 ? 'ontrack' : 'behind'
 *   daysRemaining = max(1, ceil((dueDate - today) / 86400000))
 *   dailyTargetPct = max(0, 100 - progress) / daysRemaining
 */
function computeGoalStatus(goalLike) {
  const start = new Date(goalLike.startDate).getTime();
  const due = new Date(goalLike.dueDate).getTime();
  const now = Date.now();

  const elapsedFraction = clamp((now - start) / (due - start), 0, 1);
  const progressFraction = goalLike.progress / 100;
  const status = progressFraction >= elapsedFraction - 0.05 ? 'ontrack' : 'behind';

  const daysRemaining = Math.max(1, Math.ceil((due - now) / 86400000));
  const dailyTargetPct = Math.max(0, 100 - goalLike.progress) / daysRemaining;

  return { status, daysRemaining, dailyTargetPct };
}

module.exports = {
  WEIGHT_POINTS,
  todayStr,
  clamp,
  bumpActivity,
  applyCompletionChange,
  recomputeTask,
  recomputeMilestone,
  recomputeGoal,
  computeGoalStatus,
};
