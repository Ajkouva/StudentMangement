import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`; // Although my backend doesn't check it yet middleware-wise, good practice
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
