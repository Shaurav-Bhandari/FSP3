import React from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import About from '../components/About';
import Team from '../components/Team';
import Gallery from '../components/Gallery';

const Home = () => {
    const services = [
        {
            icon: '🏋️‍♂️',
            title: 'Professional Training',
            description: 'Expert coaching and personalized training programs'
        },
        {
            icon: '⚽',
            title: 'Skill Development',
            description: 'Focus on technical skills and tactical understanding'
        },
        {
            icon: '🎯',
            title: 'Performance Analysis',
            description: 'Regular assessments and progress tracking'
        },
        {
            icon: '🏆',
            title: 'Competitive Play',
            description: 'Opportunities to participate in matches and tournaments'
        }
    ];

    return (
        <div className="min-h-screen">
            <Hero />
            <About />
            <Team />
            <Gallery />
            
            {/* Services Section */}
            <section id="services-section" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-4xl font-bold text-center mb-16">Our Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                            >
                                <div className="text-4xl mb-4">{service.icon}</div>
                                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                                <p className="text-gray-600">{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                        Join us today and take the first step towards becoming a professional footballer.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register"
                            className="bg-white text-blue-600 px-8 py-3 rounded-full text-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            Register Now
                        </Link>
                        <Link
                            to="/sessions"
                            className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                        >
                            View Sessions
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home; 