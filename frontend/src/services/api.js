import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://35.200.152.221:8082/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const claimsAPI = {
  getDashboardMetrics: async () => {
    const response = await api.get('/claims/dashboard_metrics/');
    return response.data;
  },

  getClaims: async (params = {}) => {
    const response = await api.get('/claims/', { params });
    return response.data;
  },

  searchClaims: async (searchParams) => {
    const response = await api.get('/claims/', { params: searchParams });
    return response.data;
  },
};

export default api;
