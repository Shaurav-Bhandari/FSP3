import { useState } from 'react';
import { Link } from 'react-router-dom';
import BookAppointment from './BookAppointment';

const About = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <>
      {/* Hero Section with Background */}
      <div 
        id="about-section"
        className="relative h-screen w-full bg-cover bg-center bg-no-repeat flex items-center"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')"
        }}
      >
        <div className="container mx-auto px-8 mt-16">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight">
              ABOUT US
            </h1>
            <p className="text-white text-lg leading-relaxed max-w-xl mb-8">
              At FSP, we are a passionate collective committed to helping young football enthusiasts develop their skills, build discipline, and ignite their path toward becoming professional athletes. We believe in nurturing talent with the right guidance, training, and community support — ensuring that every aspiring player has a chance to grow both on and off the field.
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-black text-white px-8 py-4 rounded-md text-base font-semibold hover:bg-gray-800 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
              >
                Book an Appointment
              </button>
              
              <Link
                to="/contact"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-md text-base font-semibold hover:bg-blue-700 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out text-center"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Our Mission</h2>
            <p className="text-gray-600 text-lg mb-12">
              We believe in nurturing talent with the right guidance, training, and community support. Our comprehensive approach ensures that every aspiring player has the opportunity to develop their skills while building character and discipline that extends beyond the football field.
            </p>
          </div>
        </div>
      </section>

      {/* Book Appointment Modal */}
      <BookAppointment 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
    </>
  );
};

export default About;