import axios from '../../api/axios';

// Helper function to store auth data consistently
const storeAuthData = (data) => {
  localStorage.setItem('access', data.access);
  localStorage.setItem('refresh', data.refresh);
  if (data.user) {
    localStorage.setItem('user', JSON.stringify(data.user));
  }
};

// Auth functions
const register = async (userData) => {
  const response = await axios.post('/users/register/', userData);
  return response.data;
};

const registerServiceProvider = async (userData) => {
  const response = await axios.post('/users/register/provider/', {
    ...userData,
    is_service_provider: true
  });
  return response.data;
};

const login = async (credentials) => {
  const response = await axios.post('/auth/token/', credentials);
  if (response.data) {
    storeAuthData({
      access: response.data.access,
      refresh: response.data.refresh,
      user: response.data.user || await fetchCurrentUser()
    });
  }
  return response.data;
};

const fetchCurrentUser = async () => {
  const response = await axios.get('/users/me/');
  return response.data;
};

const updateUser = async (userData) => {
  return await axios.patch('/users/mes/', userData);
};


const refreshToken = async () => {
  const refresh = localStorage.getItem('refresh');
  const response = await axios.post('/auth/token/refresh/', { refresh });
  if (response.data) {
    localStorage.setItem('access', response.data.access);
    if (response.data.refresh) {
      localStorage.setItem('refresh', response.data.refresh);
    }
    return response.data;
  }
};

const verifyToken = async () => {
  const token = localStorage.getItem('access');
  return await axios.post('/auth/token/verify/', { token });
};

const logout = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
};

// Service functions
const createService = async (serviceData) => {
  return await axios.post('/services/', serviceData);
};

const getServices = async () => {
  return await axios.get('/services/');
};

const getService = async (id) => {
  return await axios.get(`/services/${id}/`);
};

const updateService = async (id, serviceData) => {
  return await axios.patch(`/services/${id}/`, serviceData);
};

const deleteService = async (id) => {
  return await axios.delete(`/services/${id}/`);
};

// Queue functions




const getQueue = async (id) => {
  return await axios.get(`/queues/${id}/`);
};

const updateQueueStatus = async (id, status) => {
  return await axios.patch(`/queues/${id}/`, { status });
};

const deleteQueue = async (id) => {
  return await axios.delete(`/queues/${id}/`);
};

const getQueueStats = async () => {
  return await axios.get('/queues/stats/');
};

// Window functions
const createWindow = async (windowData) => {
  return await axios.post('/windows/', windowData);
};

const getWindows = async () => {
  return await axios.get('/windows/');
};

const getWindow = async (id) => {
  return await axios.get(`/windows/${id}/`);
};

const updateWindowStatus = async (id, status) => {
  return await axios.patch(`/windows/${id}/`, { status });
};

const assignWindowToProvider = async (id, providerId) => {
  return await axios.patch(`/windows/${id}/assign/`, { provider_id: providerId });
};

const deleteWindow = async (id) => {
  return await axios.delete(`/windows/${id}/`);
};


// Window methods
const getAvailableWindows = async () => {
  return await axios.get('/windows/available/');
};

const assignQueueToWindow = async (windowId) => {
  return await axios.post(`/windows/${windowId}/assign-queue/`);
};

const assignAllQueues = async () => {
  return await axios.get('/windows/assign-all/');
};


const assignToBestWindow = async (queueId) => {
  return await axios.post('/windows/assign-best/', { queue_id: queueId });
};

// Queue methods
const getQueues = async () => {
  return await axios.get('/queues/');
};

const joinQueue = async (queueData) => {
  return await axios.post('/queues/', queueData);
};


const getMyQueues = async () => {
  return await axios.get('/queues/my_queues/');
};


// Axios interceptors
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await refreshToken();
        const newAccessToken = localStorage.getItem('access');
        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default {
  // Auth
  register,
  registerServiceProvider,
  login,
  logout,
  refreshToken,
  verifyToken,
  getCurrentUser: fetchCurrentUser,
  updateUser,
  
  // Services
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  
  // Queues
  joinQueue,
  getQueues,
  getQueue,
  updateQueueStatus,
  deleteQueue,
  getMyQueues,
  getQueueStats,
  
  // Windows
  createWindow,
  getWindows,
  getWindow,
  updateWindowStatus,
  assignWindowToProvider,
  deleteWindow,

  //others
  getAvailableWindows,
  assignQueueToWindow,
  assignAllQueues,
  assignToBestWindow
};