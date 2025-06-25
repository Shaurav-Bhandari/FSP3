import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login, user, loading: authLoading } = useAuth();

    // Debug: Log all state changes
    useEffect(() => {
        console.log('=== LOGIN COMPONENT STATE ===');
        console.log('user:', user);
        console.log('authLoading:', authLoading);
        console.log('token in localStorage:', localStorage.getItem('adminToken'));
        console.log('current location:', location.pathname);
        console.log('=============================');
    }, [user, authLoading, location.pathname]);

    // Handle navigation when user becomes authenticated
    useEffect(() => {
        console.log('Navigation useEffect triggered - user:', user, 'authLoading:', authLoading);
        
        if (user && !authLoading) {
            console.log('🎯 Attempting navigation to dashboard...');
            try {
                navigate('/dashboard', { replace: true });
                console.log('✅ Navigation called successfully');
            } catch (err) {
                console.error('❌ Navigation failed:', err);
            }
        }
    }, [user, authLoading, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🚀 Login form submitted with:', { name });

        try {
            setError('');
            setLoading(true);
            
            console.log('📞 Calling login function...');
            const result = await login(name, password);
            console.log('📥 Login result received:', result);
            
            if (result.success) {
                console.log('✅ Login reported success');
                // Let useEffect handle navigation
            } else {
                console.log('❌ Login failed:', result.error);
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            console.error('💥 Login error caught:', err);
            setError('Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
            console.log('🏁 Login attempt completed, loading set to false');
        }
    }

    // Debug: Show current state in UI
    const debugInfo = (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4 text-xs">
            <h3 className="font-bold">Debug Info:</h3>
            <p>User: {user ? 'Authenticated' : 'Not authenticated'}</p>
            <p>Auth Loading: {authLoading ? 'true' : 'false'}</p>
            <p>Token: {localStorage.getItem('adminToken') ? 'Present' : 'Missing'}</p>
            <p>Current Path: {location.pathname}</p>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Admin Login
                    </h2>
                </div>
                
                {/* Add debug info */}
                {debugInfo}
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                <form 
                    className="mt-8 space-y-6" 
                    onSubmit={handleSubmit}
                    noValidate
                >
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Admin name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || authLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>
                
                {/* Manual navigation test button */}
                <button
                    onClick={() => {
                        console.log('🧪 Manual navigation test...');
                        navigate('/dashboard');
                    }}
                    className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    Test Navigation (Debug)
                </button>
            </div>
        </div>
    );
}

export default Login;