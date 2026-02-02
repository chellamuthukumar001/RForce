import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear token and redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    getUser: () => api.get('/auth/user')
};

// Volunteer API
export const volunteerAPI = {
    createProfile: (data) => api.post('/volunteers', data),
    getAll: () => api.get('/volunteers'),
    getMe: () => api.get('/volunteers/me'),
    getById: (id) => api.get(`/volunteers/${id}`),
    updateAvailability: (availability) => api.patch('/volunteers/availability', { availability })
};

// Disaster API
export const disasterAPI = {
    create: (data) => api.post('/disasters', data),
    getAll: (status) => api.get('/disasters', { params: { status } }),
    getById: (id) => api.get(`/disasters/${id}`),
    updateStatus: (id, status) => api.patch(`/disasters/${id}`, { status }),
    delete: (id) => api.delete(`/disasters/${id}`)
};

// Task API
export const taskAPI = {
    create: (data) => api.post('/tasks', data),
    getAll: (params) => api.get('/tasks', { params }),
    getMyTasks: () => api.get('/tasks/my-tasks'),
    getById: (id) => api.get(`/tasks/${id}`),
    assign: (taskId, volunteerIds) => api.post(`/tasks/${taskId}/assign`, { volunteer_ids: volunteerIds }),
    updateStatus: (taskId, status) => api.patch(`/tasks/${taskId}/status`, { status }),
    updateAssignment: (assignmentId, status) => api.patch(`/tasks/assignments/${assignmentId}`, { status })
};

// AI API
export const aiAPI = {
    rankVolunteers: (taskId, topN = 5) => api.post('/ai/rank-volunteers', { task_id: taskId, top_n: topN }),
    autoAssign: (taskId, numberOfVolunteers = 3) => api.post('/ai/auto-assign', { task_id: taskId, number_of_volunteers: numberOfVolunteers })
};

// Updates API
export const updatesAPI = {
    create: (data) => api.post('/updates', data),
    getAll: (params) => api.get('/updates', { params }),
    delete: (id) => api.delete(`/updates/${id}`)
};

export default api;
