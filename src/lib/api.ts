const API_URL = '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Something went wrong');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (data: any) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  },
  tasks: {
    list: () => request('/tasks'),
    create: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/tasks/${id}`, { method: 'DELETE' }),
    deleteMultiple: (ids: number[]) => request('/tasks/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    updateMultiple: (ids: number[], data: any) => request('/tasks/bulk-update', { method: 'POST', body: JSON.stringify({ ids, data }) }),
    clearAll: () => request('/tasks', { method: 'DELETE' }),
    clearCompleted: () => request('/tasks/completed', { method: 'DELETE' }),
  },
  users: {
    list: () => request('/users'),
    updateProfile: (data: { name?: string; avatar_url?: string }) => request('/users/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  },
  team: {
    list: () => request('/team'),
    listPending: () => request('/team/pending'),
    invite: (userId: number) => request('/team/invite', { method: 'POST', body: JSON.stringify({ userId }) }),
    approve: (userId: number) => request('/team/approve', { method: 'POST', body: JSON.stringify({ userId }) }),
    leave: () => request('/team/leave', { method: 'POST' }),
    remove: (userId: number) => request(`/team/${userId}`, { method: 'DELETE' }),
  },
};
