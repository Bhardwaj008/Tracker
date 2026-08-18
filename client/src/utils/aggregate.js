// Cross-cutting client-side aggregation helpers used by the Today and Stats
// screens.
//
// A couple of the v2 mockup's stat rows (per-weight "done today" counts,
// best-streak, the per-Topic ranked breakdown) aren't returned directly by
// any existing endpoint. Per the refactor contract, rather than block on a
// new backend aggregate route we don't know exists yet, we derive them
// client-side from data we already have an endpoint for: GET /api/goals
// (list) + GET /api/goals/:id (nested topics -> subtopics -> tasks tree).
// If the backend later grows dedicated aggregate endpoints, these call
// sites are the only places that would need to change.

const WEIGHTS = ['S', 'M', 'L', 'XL'];

export function emptyWeightCounts() {
  return WEIGHTS.reduce((acc, w) => {
    acc[w] = { done: 0, total: 0 };
    return acc;
  }, {});
}

// Flattens a goal-detail response's nested topics -> subtopics -> tasks tree
// into a flat task list, each task annotated with its parent topic/subtopic
// ids and titles.
export function flattenTasks(topics = []) {
  const tasks = [];
  for (const topic of topics) {
    const topicId = topic._id || topic.id;
    for (const subtopic of topic.subtopics || []) {
      const subtopicId = subtopic._id || subtopic.id;
      for (const task of subtopic.tasks || []) {
        tasks.push({
          ...task,
          topicId,
          topicTitle: topic.title,
          subtopicId,
          subtopicTitle: subtopic.title,
        });
      }
    }
  }
  return tasks;
}

// Fetches every active (non-archived) goal's full nested detail. Used as the
// shared data source for the client-side aggregates below. Individual
// failures are swallowed (a goal that fails to load just drops out of the
// aggregate) so one bad request doesn't blank the whole screen.
export async function loadActiveGoalDetails(api) {
  const goals = await api.getGoals(false);
  const details = await Promise.all(
    goals.map((g) => api.getGoal(g._id || g.id).catch(() => null)),
  );
  return details.filter(Boolean);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// done/total per weight tier, scoped to tasks due today — backs the Today
// screen's S/M/L/XL stat-card row.
export function weightCountsForToday(goalDetails) {
  const counts = emptyWeightCounts();
  const today = new Date();
  for (const { topics } of goalDetails) {
    for (const task of flattenTasks(topics)) {
      if (!task.dueDate) continue;
      const due = new Date(task.dueDate);
      if (Number.isNaN(due.getTime()) || !isSameDay(due, today)) continue;
      const bucket = counts[task.weight];
      if (!bucket) continue;
      bucket.total += 1;
      if (task.completed) bucket.done += 1;
    }
  }
  return counts;
}

// done/total per weight tier across every task — backs the Stats screen's
// weight bars.
export function weightCountsAllTime(goalDetails) {
  const counts = emptyWeightCounts();
  for (const { topics } of goalDetails) {
    for (const task of flattenTasks(topics)) {
      const bucket = counts[task.weight];
      if (!bucket) continue;
      bucket.total += 1;
      if (task.completed) bucket.done += 1;
    }
  }
  return counts;
}

// Longest run of consecutive active (count > 0) days within the 70-day
// heatmap window, floor-clamped to the current streak. This is an
// approximation of "best streak" — the heatmap is only a 70-day window, not
// full history — but it's the best the client can do without a dedicated
// backend field.
export function bestStreakFromHeatmap(heatmap = [], currentStreak = 0) {
  let best = 0;
  let run = 0;
  for (const entry of heatmap) {
    if (entry.count > 0) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }
  return Math.max(best, currentStreak);
}

// Per-Topic done/total + cached progress, sorted by progress descending —
// backs the Stats screen's ranked breakdown.
export function topicBreakdown(goalDetails) {
  const rows = [];
  for (const { topics } of goalDetails) {
    for (const topic of topics || []) {
      const tasks = (topic.subtopics || []).flatMap((st) => st.tasks || []);
      const done = tasks.filter((t) => t.completed).length;
      rows.push({
        id: topic._id || topic.id,
        title: topic.title,
        progress: topic.progress || 0,
        done,
        total: tasks.length,
      });
    }
  }
  return rows.sort((a, b) => b.progress - a.progress);
}

export function sumTimeSpent(goalDetails) {
  let total = 0;
  for (const { topics } of goalDetails) {
    for (const task of flattenTasks(topics)) {
      total += task.timeSpentSeconds || 0;
    }
  }
  return total;
}

export function countCompletedTasks(goalDetails) {
  let total = 0;
  for (const { topics } of goalDetails) {
    total += flattenTasks(topics).filter((t) => t.completed).length;
  }
  return total;
}

export function countActiveTopics(goalDetails) {
  return goalDetails.reduce((acc, { topics }) => acc + (topics?.length || 0), 0);
}
