import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSession, setNewSession] = useState({
        date: '',
        start_time: '',
        end_time: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchBookings();
        }
    }, [user]);

    const fetchBookings = async () => {
        try {
            const response = await axios.get('/api/sessions/bookings');
            setBookings(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch bookings');
            setLoading(false);
        }
    };

    const handleCreateSession = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/sessions', newSession);
            setNewSession({ date: '', start_time: '', end_time: '' });
            // Refresh bookings to show new session
            fetchBookings();
        } catch (err) {
            setError('Failed to create session');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (user?.role !== 'admin') return <div className="text-center">Access Denied</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
            
            {/* Create New Session Form */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Create New Session</h2>
                <form onSubmit={handleCreateSession} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            value={newSession.date}
                            onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Start Time</label>
                        <input
                            type="time"
                            value={newSession.start_time}
                            onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">End Time</label>
                        <input
                            type="time"
                            value={newSession.end_time}
                            onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                    >
                        Create Session
                    </button>
                </form>
            </div>

            {/* Bookings List */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">All Bookings</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {booking.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(booking.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(booking.start_time).toLocaleTimeString()} - 
                                        {new Date(booking.end_time).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {bookings.length === 0 && (
                    <p className="text-center text-gray-500 py-4">No bookings found.</p>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard; 