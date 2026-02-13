/**
 * AUTHENTICATION CONTEXT
 * 
 * This provides authentication state and functions to the entire React app.
 * 
 * WHAT IS REACT CONTEXT:
 * Context is like a "global state" that any component can access without
 * passing props down through multiple levels (prop drilling).
 * 
 * WITHOUT Context (prop drilling - bad):
 *   App → Header → Nav → UserMenu (passing user prop 3 levels deep!)
 * 
 * WITH Context (clean):
 *   Any component can useAuth() to get user info directly
 * 
 * HOW THIS WORKS:
 * 1. App.jsx wraps everything in <AuthProvider>
 * 2. Any component can call useAuth() to get:
 *    - user: current logged-in user data
 *    - login(email, password): function to log in
 *    - logout(): function to log out
 *    - loading: whether auth state is still being checked
 */

import { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

// Create the context (the "global storage")
const AuthContext = createContext();

/**
 * AUTHENTICATION PROVIDER COMPONENT
 * 
 * This component wraps the entire app and provides authentication state.
 * It stores:
 * - user: currently logged-in user object
 * - loading: whether we're checking if user is logged in
 * And provides functions:
 * - login(email, password): to log in
 * - logout(): to log out
 */
export const AuthProvider = ({ children }) => {
    // STATE: Currently logged-in user (null if not logged in)
    const [user, setUser] = useState(null);

    // STATE: Whether we're still checking if user is logged in (on page load)
    const [loading, setLoading] = useState(true);

    /**
     * ON COMPONENT MOUNT (runs once when app loads)
     * 
     * Check if user was previously logged in:
     * When user logs in, we save token & user data to localStorage.
     * When page reloads, we check localStorage to "remember" logged-in user.
     * 
     * WHY USE LOCALSTORAGE:
     * - Persists data even after browser closes
     * - User stays logged in until they explicitly log out
     * - Avoids asking for credentials on every page refresh
     */
    useEffect(() => {
        // Try to get user data from browser storage
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (storedUser && token) {
            // User was previously logged in, restore their session
            setUser(JSON.parse(storedUser));  // Parse JSON string back to object
        }

        // Done checking, stop showing loading screen
        setLoading(false);
    }, []);  // Empty array = runs only once on mount

    /**
     * LOGIN FUNCTION
     * 
     * Called when user submits login form.
     * 
     * FLOW:
     * 1. User enters email & password in Login.jsx
     * 2. Login.jsx calls: login(email, password)
     * 3. This function sends APIrequest to backend
     * 4. Backend checks database (PostgreSQL)
     * 5. If credentials are valid:
     *    - Backend returns JWT token & user data
     *    - Frontend saves token & user to localStorage
     *    - Frontend updates state: setUser(user)
     *    - UI automatically updates (React re-renders)
     * 6. If credentials are invalid:
     *    - Backend returns 400 error
     *    - Frontend shows error message
     * 
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Object} - { success: true/false, error: "message" }
     */
    const login = async (email, password) => {
        try {
            // Send POST request to backend login endpoint
            // api.post automatically adds 'http://localhost:5000/api' prefix
            const response = await api.post('/auth/login', { email, password });

            // Backend returns: { token: "jwt_token", user: { id, email, role, name, details } }
            const { token, user } = response.data;

            // Save token and user data to browser storage
            // This keeps user logged in even after page refresh
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));  // Convert object to JSON string

            // Update React state (triggers re-render of components)
            setUser(user);

            // Return success to the calling component
            return { success: true };

        } catch (error) {
            console.error("Login failed", error);

            // Extract error message from backend response
            // error.response?.data?.error is the message from backend
            // If not available, use generic "Login failed"
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    };

    /**
     * LOGOUT FUNCTION
     * 
     * Called when user clicks logout button.
     * 
     * FLOW:
     * 1. Remove token & user from localStorage
     * 2. Reset user state to null
     * 3. UI updates automatically (React re-renders)
     * 4. User is redirected to login page
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    /**
     * PROVIDE CONTEXT TO CHILD COMPONENTS
     * 
     * Any component inside <AuthProvider> can access these values via useAuth()
     * 
     * Example in Login.jsx:
     *   const { user, login } = useAuth();
     *   await login(email, password);
     */
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

/**
 * CUSTOM HOOK: useAuth()
 * 
 * Easy way for components to access authentication context.
 * 
 * USAGE IN COMPONENTS:
 * import { useAuth } from '../context/AuthContext';
 * 
 * function SomeComponent() {
 *     const { user, login, logout, loading } = useAuth();
 *     
 *     if (loading) return <div>Loading...</div>;
 *     if (!user) return <div>Please log in</div>;
 *     return <div>Welcome, {user.name}!</div>;
 * }
 */
export const useAuth = () => useContext(AuthContext);
