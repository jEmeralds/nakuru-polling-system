import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Only logout on auth-specific 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout if it's an auth endpoint returning 401
    // This prevents logout when other endpoints fail
    if (error.response?.status === 401 && 
        error.config?.url?.includes('/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Helper function to add comments
export const addComment = async (issueId, commentText) => {
  try {
    const response = await api.post(`/issues/${issueId}/comments`, {
      comment_text: commentText
    });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  getLocations: () => api.get('/auth/locations')
}

export default api