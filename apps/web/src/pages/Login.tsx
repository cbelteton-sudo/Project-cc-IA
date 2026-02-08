import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Hammer } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // TEMPORARY: Hardcoded to ensure fix works immediately
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4180/api';
            const res = await axios.post(`${API_URL}/auth/login`, { email, password });
            const { access_token } = res.data;

            // Basic jwt decode simulation for MVP (since we don't have a /me endpoint yet)
            // In production, use jwt-decode library
            const payload = JSON.parse(atob(access_token.split('.')[1]));

            const userData = {
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
                tenantId: payload.tenantId,
                name: payload.name // Assuming token has name, otherwise it will come from profile endpoint later
            };

            login(access_token, userData);

            if (payload.role === 'CONTRATISTA') {
                navigate('/portal/dashboard');
            } else if (payload.role === 'PM') {
                navigate('/field/dashboard');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            console.error('Login Error:', err);
            if (err.response) {
                setError(`Server Error: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else if (err.request) {
                setError('Network Error: No response from server. Check if API is running.');
            } else {
                setError(`Error: ${err.message}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <Hammer className="text-blue-600 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Login to Constructora</h2>

                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
                    >
                        Sign In
                    </button>
                </form>
                <div className="mt-4 text-center text-xs text-gray-500">
                    Use: admin@demo.com / password123
                </div>
            </div>
        </div>
    );
};
