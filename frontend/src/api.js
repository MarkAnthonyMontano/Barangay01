import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // backend URL
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
