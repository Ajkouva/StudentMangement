import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'TEACHER') navigate('/teacher');
            else if (user.role === 'STUDENT') navigate('/student');
        } else {
            setError(result.error);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
                {/* Decorative background blur */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <div className="mb-8 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 mb-4">
                        <Lock size={20} />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-gray-400 text-sm mt-2">Sign in to your school portal</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
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

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-3 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
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

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-gray-900 font-semibold py-3 rounded-xl hover:bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
                    </button>

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

export default Login;
