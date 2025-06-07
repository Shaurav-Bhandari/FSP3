import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const scrollToSection = (sectionId: string) => {
    if (!isHomePage) return;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-x-4 top-4 z-50 h-16 sm:h-20 transition-all duration-700 backdrop-blur-md bg-white/80 rounded-2xl shadow-lg max-w-7xl mx-auto flex items-center">
      <header className="w-full h-full px-4 sm:px-6">
        <nav className="flex h-full items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 cursor-pointer">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded transform rotate-45 flex items-center justify-center">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-sm transform -rotate-45"></div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: "'Roboto', sans-serif" }}>
                FSP Club
              </span>
            </Link>
          </div>
          
          {/* Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            <div className="hidden md:flex items-center space-x-6" style={{ fontFamily: "'Atma', cursive" }}>
              {isHomePage ? (
                <>
                  <button 
                    onClick={() => scrollToSection('home')} 
                    className="text-gray-600 hover:text-gray-900 text-lg"
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => scrollToSection('about-section')} 
                    className="text-gray-600 hover:text-gray-900 text-lg"
                  >
                    About
                  </button>
                  <button 
                    onClick={() => scrollToSection('services-section')} 
                    className="text-gray-600 hover:text-gray-900 text-lg"
                  >
                    Services
                  </button>
                  <button 
                    onClick={() => scrollToSection('gallery')} 
                    className="text-gray-600 hover:text-gray-900 text-lg"
                  >
                    Gallery
                  </button>
                </>
              ) : (
                <>
                  <Link to="/#home" className="text-gray-600 hover:text-gray-900 text-lg">Home</Link>
                  <Link to="/#about-section" className="text-gray-600 hover:text-gray-900 text-lg">About</Link>
                  <Link to="/#services-section" className="text-gray-600 hover:text-gray-900 text-lg">Services</Link>
                  <Link to="/#gallery" className="text-gray-600 hover:text-gray-900 text-lg">Gallery</Link>
                </>
              )}
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 text-lg">
                Contact
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default Navigation;