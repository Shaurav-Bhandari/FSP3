import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
    const { user } = useAuth();

    if (!user || user.role !== 'admin') {
        return <Navigate to="/sessions" replace />;
    }

    return children;
};

export default AdminRoute; 