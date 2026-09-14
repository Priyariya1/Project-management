import api from './client';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const projectsApi = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (payload) => api.post('/projects', payload),
  update: (id, payload) => api.put(`/projects/${id}`, payload),
  remove: (id) => api.delete(`/projects/${id}`),
  tasks: (id, params) => api.get(`/projects/${id}/tasks`, { params }),
};

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  get: (id) => api.get(`/tasks/${id}`),
  create: (payload) => api.post('/tasks', payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  setCompletion: (id, completed) => api.patch(`/tasks/${id}/complete`, { completed }),
  remove: (id) => api.delete(`/tasks/${id}`),
};

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
  activity: (params) => api.get('/dashboard/activity', { params }),
};
