import { useState } from 'react';
import BookAppointment from './BookAppointment.tsx';

const About = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <>
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
            
            {/* Book Appointment Button */}
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="bg-black text-white px-8 py-4 rounded-md text-base font-semibold hover:bg-gray-800 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
            >
              Book an Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <BookAppointment 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
    </>
  );
};

export default About;