import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isContactPage = location.pathname === '/contact';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    if (isContactPage) {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (isContactPage) {
      navigate('/');
    } else {
      scrollToSection('home-section');
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'}`}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center">
            <img 
              src="/logo.svg" 
              alt="FSP FC Logo" 
              className="h-14 w-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-logo.svg';
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home-section')} className="text-gray-600 hover:text-black transition-colors duration-300">
              Home
            </button>
            <button onClick={() => scrollToSection('about-section')} className="text-gray-600 hover:text-black transition-colors duration-300">
              About
            </button>
            <button onClick={() => scrollToSection('team-section')} className="text-gray-600 hover:text-black transition-colors duration-300">
              Team
            </button>
            <a 
              href="/contact" 
              className="text-gray-600 hover:text-black transition-colors duration-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gray-600 hover:text-black transition-colors duration-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-md z-40">
            <div className="h-full flex flex-col items-center justify-center space-y-8">
              <button 
                onClick={() => scrollToSection('home-section')} 
                className="text-white text-2xl font-medium hover:text-gray-300 transition-colors duration-300"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('about-section')} 
                className="text-white text-2xl font-medium hover:text-gray-300 transition-colors duration-300"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection('team-section')} 
                className="text-white text-2xl font-medium hover:text-gray-300 transition-colors duration-300"
              >
                Team
              </button>
              <a 
                href="/contact" 
                className="text-white text-2xl font-medium hover:text-gray-300 transition-colors duration-300"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 