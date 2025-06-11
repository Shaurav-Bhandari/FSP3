import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SessionBooking from './pages/SessionBooking';
import Login from './pages/Login.jsx';
import Register from './pages/Register';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Contact from './pages/Contact';
import Navigation from './components/Navigation';

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="bg-white text-gray-800">
                    <Navigation />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route
                            path="/sessions"
                            element={
                                <PrivateRoute>
                                    <SessionBooking />
                                </PrivateRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App; 