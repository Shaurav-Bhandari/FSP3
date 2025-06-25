import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    console.log('PrivateRoute - user:', user, 'loading:', loading);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user) {
        console.log('PrivateRoute - no user, redirecting to login');
        return <Navigate to="/login" />;
    }

    console.log('PrivateRoute - user authenticated, rendering children');
    return children;
}

export default PrivateRoute; 