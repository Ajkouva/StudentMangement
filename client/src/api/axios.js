/**
 * API CONFIGURATION (Axios Setup)
 * 
 * This file configures the HTTP client that communicates with the backend server.
 * 
 * HOW FRONTEND TALKS TO BACKEND:
 * 1. Frontend code calls: api.post('/auth/login', { email, password })
 * 2. Axios sends HTTP POST request to: http://localhost:5000/api/auth/login
 * 3. Backend Express server receives the request
 * 4. Backend processes it (checks database, validates credentials)
 * 5. Backend sends JSON response back: { token: "...", user: {...} }
 * 6. Axios receives response and returns it to frontend code
 * 7. Frontend updates UI based on response
 * 
 * WHY USE AXIOS (instead of fetch):
 * - Automatic JSON parsing
 * - Request/Response interceptors (for adding auth tokens automatically)
 * - Better error handling
 * - Works in older browsers
 */

import axios from 'axios';

/**
 * CREATE API INSTANCE
 * 
 * This creates a custom axios instance with our backend URL.
 * All API calls will be prefixed with this baseURL.
 * 
 * Example: api.post('/auth/login') → POST to http://localhost:5000/api/auth/login
 */
const api = axios.create({
    baseURL: 'http://localhost:5000/api',  // Backend server address
});

/**
 * REQUEST INTERCEPTOR
 * 
 * This code runs BEFORE every API request is sent.
 * It automatically adds the JWT token to request headers.
 * 
 * HOW JWT AUTHENTICATION WORKS:
 * 1. User logs in → backend returns JWT token
 * 2. Frontend stores token in localStorage
 * 3. For future requests, frontend includes token in Authorization header
 * 4. Backend verifies token to confirm user identity
 * 5. Backend processes request if token is valid
 * 
 * WHY USE INTERCEPTORS:
 * Instead of manually adding token to every request, the interceptor does it automatically:
 * 
 * WITHOUT interceptor (tedious):
 *   api.get('/student/dashboard', { 
 *     headers: { Authorization: `Bearer ${token}` } 
 *   })
 * 
 * WITH interceptor (clean):
 *   api.get('/student/dashboard')  // Token added automatically!
 */
api.interceptors.request.use(
    (config) => {
        // Get JWT token from browser's localStorage
        const token = localStorage.getItem('token');

        if (token) {
            // Add token to request headers
            // Format: "Authorization: Bearer <token>"
            // Backend reads this header to identify the user
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;  // Send the modified request
    },
    (error) => {
        // If there's an error preparing the request, reject it
        return Promise.reject(error);
    }
);

/**
 * RESPONSE INTERCEPTOR (Optional - not implemented yet)
 * 
 * You could add this to handle common response scenarios:
 * - Automatically log out user if token expires (401 error)
 * - Show error messages for failed requests
 * - Refresh expired tokens automatically
 * 
 * Example:
 * api.interceptors.response.use(
 *     (response) => response,
 *     (error) => {
 *         if (error.response?.status === 401) {
 *             // Token expired, log out user
 *             localStorage.removeItem('token');
 *             window.location.href = '/login';
 *         }
 *         return Promise.reject(error);
 *     }
 * );
 */

/**
 * EXPORT THE API INSTANCE
 * 
 * Other files import this to make API calls:
 * 
 * import api from '../api/axios';
 * const response = await api.post('/auth/login', { email, password });
 */
export default api;
