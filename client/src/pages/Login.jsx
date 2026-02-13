/**
 * LOGIN PAGE COMPONENT
 * 
 * This is the entry point of the application.
 * Users enter credentials to access Student or Teacher portal.
 * 
 * COMPONENT RESPONSIBILITIES:
 * 1. Display login form (email + password)
 * 2. Validate user input
 * 3. Call backend API to authenticate
 * 4. Redirect to appropriate dashboard based on user role
 * 5. Show error messages if login fails
 * 
 * USER FLOW:
 * 1. User enters email & password
 * 2. User clicks "Sign In" button
 * 3. handleSubmit() function runs
 * 4. Frontend sends POST request to backend: /api/auth/login
 * 5. Backend checks PostgreSQL database:
 *    - If credentials match: returns JWT token + user data
 *    - If credentials don't match: returns 400 error
 * 6. If successful:
 *    - Save token to localStorage (via AuthContext)
 *    - Redirect to /teacher or /student based on role
 * 7. If failed:
 *    - Show error message below form
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
    /**
     * COMPONENT STATE (using React useState hook)
     * 
     * State variables that change during user interaction:
     * - email: user's email input
     * - password: user's password input
     * - error: error message to display (empty string = no error)
     * - isLoading: whether login request is in progress
     * 
     * When state changes, React automatically re-renders the component.
     */
    const [email, setEmail] = useState('');      // Email input value
    const [password, setPassword] = useState(''); // Password input value
    const [error, setError] = useState('');       // Error message ('' = no error)
    const [isLoading, setIsLoading] = useState(false); // Show loading spinner

    /**
     * HOOKS FROM CONTEXTS
     * 
     * - useAuth(): Get authentication functions from AuthContext
     * - useNavigate(): React Router hook to programmatically navigate
     */
    const { login } = useAuth();        // login function from AuthContext
    const navigate = useNavigate();     // Navigation function from React Router

    /**
     * HANDLE FORM SUBMISSION
     * 
     * Called when user clicks "Sign In" button or presses Enter.
     * 
     * FLOW:
     * 1. Prevent default form submission (which would reload page)
     * 2. Clear any previous error messages
     * 3. Show loading spinner
     * 4. Call login function (sends API request to backend)
     * 5. If login successful:
     *    - Get user data from localStorage
     *    - Redirect to /teacher or /student based on role
     * 6. If login failed:
     *    - Show error message
     * 7. Hide loading spinner
     * 
     * @param {Event} e - Form submit event
     */
    const handleSubmit = async (e) => {
        // Prevent page reload (default form behavior)
        e.preventDefault();

        // Clear previous error message
        setError('');

        // Show loading spinner (disables button, shows animation)
        setIsLoading(true);

        // Call login function from AuthContext
        // This sends POST request to backend: /api/auth/login
        // Backend checks database and returns result
        const result = await login(email, password);

        if (result.success) {
            // ✅ Login successful!
            // Get user data from localStorage (set by AuthContext)
            const user = JSON.parse(localStorage.getItem('user'));

            // Redirect based on user role
            // Teacher → /teacher, Student → /student
            if (user.role === 'TEACHER') {
                navigate('/teacher');
            } else if (user.role === 'STUDENT') {
                navigate('/student');
            }
        } else {
            // ❌ Login failed
            // Show error message (e.g., "Invalid credentials")
            setError(result.error);
        }

        // Hide loading spinner
        setIsLoading(false);
    };

    /**
     * RENDER LOGIN FORM
     * 
     * JSX (JavaScript XML) - looks like HTML but it's JavaScript
     * React converts this to actual DOM elements
     * 
     * KEY CONCEPTS:
     * - className: CSS classes for styling (Tailwind CSS)
     * - value={email}: Controlled input (React controls the value)
     * - onChange={(e) => setEmail(e.target.value)}: Update state when user types
     * - onSubmit={handleSubmit}: Call function when form is submitted
     * - {isLoading ? ... : ...}: Conditional rendering (ternary operator)
     * - {error && ...}: Only render if error exists
     */
    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
            {/* Login Card */}
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                {/* Decorative top gradient bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Header Section */}
                <div className="mb-8 text-center">
                    {/* Lock icon in colored circle */}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                        <Lock size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-gray-400 text-sm mt-2">Sign in to your school portal</p>
                </div>

                {/* Error Message (only shows if error exists) */}
                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <div className="relative group">
                            {/* Mail icon inside input field */}
                            <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />

                            {/* Email Input */}
                            {/* 
                                CONTROLLED COMPONENT:
                                - value={email}: React controls the input value
                                - onChange={(e) => setEmail(e.target.value)}: Update state when user types
                                - This makes React the "single source of truth"
                            */}
                            <input
                                type="email"
                                className="w-full bg-gray-950 border border-gray-800 text-gray-100 text-sm rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-600"
                                placeholder="name@school.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <div className="relative group">
                            {/* Lock icon inside input field */}
                            <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />

                            {/* Password Input (controlled component) */}
                            <input
                                type="password"
                                className="w-full bg-gray-950 border border-gray-800 text-gray-100 text-sm rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder-gray-600"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}  // Disable button while loading
                        className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {/* 
                            CONDITIONAL RENDERING:
                            If isLoading is true: show spinning loader
                            If isLoading is false: show "Sign In" text with arrow
                        */}
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>

                    {/* Demo Credentials Hint */}
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            For demo access use: <span className="text-gray-400 font-mono">admin@school.com</span> / <span className="text-gray-400 font-mono">admin123</span>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * EXPORT COMPONENT
 * 
 * Default export makes this component available to other files:
 * import Login from './pages/Login';
 */
export default Login;
