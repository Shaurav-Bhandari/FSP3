import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Auth endpoints
  login: (credentials: { email: string; password: string }) =>
    api.post('/admin/login', credentials),
  
  logout: () => api.post('/admin/logout'),
  
  // User management endpoints
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }),
  
  // Admin profile
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data: any) => api.patch('/admin/profile', data),

  // Booking management
  getBookings: () => api.get('/admin/bookings'),
  updateBookingStatus: (bookingId: string, status: string) =>
    api.patch(`/admin/bookings/${bookingId}/status`, { status }),
};

export default api; 