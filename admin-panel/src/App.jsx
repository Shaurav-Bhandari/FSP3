import React, { useEffect, useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login.jsx';
import PrivateRoute from './components/PrivateRoute';

function AppContent() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useLayoutEffect(() => {
        console.log('AppContent useLayoutEffect - user:', user, 'loading:', loading, 'location:', location.pathname);
        if (!loading && user && location.pathname === '/login') {
            console.log('AppContent: User authenticated on login page, navigating to dashboard.');
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate, location.pathname]);

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <AdminDashboard />
                    </PrivateRoute>
                }
            />
            <Route path="/" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        </Routes>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App; 