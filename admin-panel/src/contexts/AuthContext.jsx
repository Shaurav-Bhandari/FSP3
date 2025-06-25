import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { adminApi } from '../services/api';

// Create the context
const AuthContext = createContext(null);

// Create a provider component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('adminToken'));
    const [loading, setLoading] = useState(true);

    const verifyToken = useCallback(async (token) => {
        try {
            const response = await adminApi.getProfile();
            console.log('Profile response:', response.data);
            setUser(response.data);
            return true;
        } catch (error) {
            console.error('Profile error:', error);
            localStorage.removeItem('adminToken');
            setToken(null);
            setUser(null);
            return false;
        }
    }, []);

    useEffect(() => {
        console.log('AuthProvider useEffect - token at mount/update:', token);
        if (token) {
            verifyToken(token).finally(() => {
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [token, verifyToken]);

    const login = async (name, password) => {
        console.log('Login attempt with:', { name });
        try {
            const response = await adminApi.login({ name, password });
            console.log('Login API response:', response.data);
            const { success, token: newToken, admin, message } = response.data;
            
            if (!success) {
                console.log('Login failed (backend indicated):', message);
                return { 
                    success: false, 
                    error: message || 'Login failed' 
                };
            }

            // NEW LOG: Check newToken value before storing
            console.log('Value of newToken before localStorage.setItem:', newToken);

            // Store token
            localStorage.setItem('adminToken', newToken);
            console.log('Token written to localStorage:', localStorage.getItem('adminToken'));
            setToken(newToken);
            setUser(admin);
            console.log('Login successful, user and token state set.', admin);

            return { success: true, user: admin };
        } catch (error) {
            console.error('Login error (caught):', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Login failed' 
            };
        }
    };

    const logout = async () => {
        try {
            if (token) {
                await adminApi.logout();
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            setToken(null);
            setUser(null);
        }
    };

    const value = {
        user,
        login,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Create a custom hook for using the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}