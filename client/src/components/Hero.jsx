import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section id="home-section" className="hero-gradient min-h-screen flex items-center pt-20 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Large Blue Blob */}
        <div className="blob-1 absolute -top-20 -left-20 w-96 h-96 opacity-90"></div>
        
        {/* Yellow/Orange Blob */}
        <div className="blob-2 absolute top-32 right-10 w-80 h-80 opacity-95"></div>
        
        {/* Medium Blue Blob */}
        <div className="blob-3 absolute bottom-20 right-32 w-64 h-64 opacity-80"></div>
        
        {/* Small accent blobs */}
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gray-800">WANT TO</span><br />
                <span className="text-gray-800">PLAY</span><br />
                <span className="text-blue-800">FOOTBALL</span>
                <span className="text-gray-800 text-6xl lg:text-8xl">?</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                Join us at FSP FC where you will develop all your skills. Experience professional training in a supportive environment.
              </p>
            </div>
            
            <Link 
              to="/contact" 
              className="inline-block bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Get in touch
            </Link>
          </div>
          
          {/* Right Content - Player Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-1/2">
              <img 
                src="/hero.png"
                alt="Football Player" 
                className="w-full h-auto object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 