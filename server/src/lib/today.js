const mongoose = require('mongoose');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { todayStr } = require('./rollup');

function dateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * streak: walk backwards day-by-day from today (or yesterday if today has no
 * activity logged yet) while Activity.count > 0 for that date, stopping at
 * the first gap.
 */
async function getStreak(userId) {
  const activities = await Activity.find({ userId, count: { $gt: 0 } }, 'date').lean();
  const activeDates = new Set(activities.map((a) => a.date));

  const cursor = new Date();
  if (!activeDates.has(todayStr(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeDates.has(todayStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Last `days` days (default 70, i.e. a 7-row x 10-col grid) as [{date, count}]
 * in chronological order, oldest first. The client buckets `count` into a
 * 0-4 display level; the convention we're documenting/assuming here is:
 *   level 0 -> count 0
 *   level 1 -> count 1
 *   level 2 -> count 2-3
 *   level 3 -> count 4-5
 *   level 4 -> count 6+
 */
async function getHeatmap(userId, days = 70) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));

  const activities = await Activity.find(
    { userId, date: { $gte: todayStr(start), $lte: todayStr(end) } },
    'date count'
  ).lean();

  const countByDate = new Map(activities.map((a) => [a.date, a.count]));

  const heatmap = [];
  const cursor = new Date(start);
  for (let i = 0; i < days; i++) {
    const key = todayStr(cursor);
    heatmap.push({ date: key, count: countByDate.get(key) || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return heatmap;
}

function shapeTaskItem(t) {
  const goal = t.goalId && typeof t.goalId === 'object' ? t.goalId : null;
  const topic = t.topicId && typeof t.topicId === 'object' ? t.topicId : null;
  const subtopic = t.subtopicId && typeof t.subtopicId === 'object' ? t.subtopicId : null;
  return {
    id: t._id,
    title: t.title,
    weight: t.weight,
    dueDate: t.dueDate,
    completed: t.completed,
    progress: t.progress,
    goalId: goal ? goal._id : t.goalId,
    goalTitle: goal ? goal.title : null,
    topicId: topic ? topic._id : t.topicId,
    topicTitle: topic ? topic.title : null,
    subtopicId: subtopic ? subtopic._id : t.subtopicId,
    subtopicTitle: subtopic ? subtopic.title : null,
  };
}

/**
 * Full /today payload: streak, done-today/total-today counters (scoped to
 * tasks whose dueDate falls on today, completed or not), and the three
 * actionable buckets (overdue / due today / upcoming) of incomplete tasks
 * with denormalized goal/topic/subtopic titles for display, plus the heatmap.
 */
async function getTodayPayload(userId) {
  const uid = new mongoose.Types.ObjectId(userId);
  const startOfToday = dateOnly(new Date());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  const [streak, heatmap, incompleteWithDueDate, dueTodayTotalCount, dueTodayDoneCount] =
    await Promise.all([
      getStreak(userId),
      getHeatmap(userId),
      Task.find({ userId: uid, completed: false, dueDate: { $ne: null } })
        .populate('goalId', 'title')
        .populate('topicId', 'title')
        .populate('subtopicId', 'title')
        .sort({ dueDate: 1 })
        .lean(),
      Task.countDocuments({ userId: uid, dueDate: { $gte: startOfToday, $lt: endOfToday } }),
      Task.countDocuments({
        userId: uid,
        dueDate: { $gte: startOfToday, $lt: endOfToday },
        completed: true,
      }),
    ]);

  const overdue = [];
  const dueToday = [];
  const upcoming = [];

  for (const t of incompleteWithDueDate) {
    const shaped = shapeTaskItem(t);
    if (t.dueDate < startOfToday) overdue.push(shaped);
    else if (t.dueDate < endOfToday) dueToday.push(shaped);
    else upcoming.push(shaped);
  }

  return {
    streak,
    doneToday: dueTodayDoneCount,
    totalToday: dueTodayTotalCount,
    overdue,
    dueToday,
    upcoming,
    heatmap,
  };
}

module.exports = { getStreak, getHeatmap, getTodayPayload };
