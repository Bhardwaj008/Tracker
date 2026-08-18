// Thin fetch wrapper around the Momentum REST API.
// Base URL comes from VITE_API_URL (see .env.example); auth token is read
// from localStorage on every request so it always reflects the latest login.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Responses like DELETE /goals/:id -> {ok:true} always have a body per the
  // contract, but guard against an empty body just in case.
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  signup: (name, email, password) =>
    request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),

  // Today
  getToday: () => request('/today'),

  // Goals
  getGoals: (archived = false) => request(`/goals?archived=${archived}`),
  createGoal: (data) => request('/goals', { method: 'POST', body: data }),
  getGoal: (id) => request(`/goals/${id}`),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PATCH', body: data }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Milestones
  createMilestone: (goalId, data) =>
    request(`/goals/${goalId}/milestones`, { method: 'POST', body: data }),
  updateMilestone: (id, data) => request(`/milestones/${id}`, { method: 'PATCH', body: data }),
  deleteMilestone: (id) => request(`/milestones/${id}`, { method: 'DELETE' }),

  // Tasks
  createTask: (milestoneId, data) =>
    request(`/milestones/${milestoneId}/tasks`, { method: 'POST', body: data }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: data }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  startTimer: (id) => request(`/tasks/${id}/timer/start`, { method: 'POST' }),
  stopTimer: (id) => request(`/tasks/${id}/timer/stop`, { method: 'POST' }),

  // Subtasks
  createSubtask: (taskId, data) => request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: data }),
  updateSubtask: (id, data) => request(`/subtasks/${id}`, { method: 'PATCH', body: data }),
  deleteSubtask: (id) => request(`/subtasks/${id}`, { method: 'DELETE' }),

  // Export
  getExport: () => request('/export'),
};

export function getStoredToken() {
  return getToken();
}
