import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SessionBooking = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await axios.get('/api/sessions/available');
            setSessions(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch sessions');
            setLoading(false);
        }
    };

    const handleBooking = async (sessionId) => {
        try {
            await axios.post(`/api/sessions/${sessionId}/book`);
            // Refresh sessions after booking
            fetchSessions();
        } catch (err) {
            setError('Failed to book session');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Available Sessions</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {new Date(session.date).toLocaleDateString()}
                                </h2>
                                <p className="text-gray-600">
                                    {new Date(session.start_time).toLocaleTimeString()} - 
                                    {new Date(session.end_time).toLocaleTimeString()}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                                session.status === 'available' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}>
                                {session.status}
                            </span>
                        </div>
                        {session.status === 'available' && (
                            <button
                                onClick={() => handleBooking(session.id)}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                            >
                                Book Session
                            </button>
                        )}
                    </div>
                ))}
            </div>
            {sessions.length === 0 && (
                <p className="text-center text-gray-500">No available sessions found.</p>
            )}
        </div>
    );
};

export default SessionBooking; 