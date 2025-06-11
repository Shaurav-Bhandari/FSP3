import { Facebook, Youtube, MessageSquare, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation */}
        <div>
          <h4 className="font-bold mb-4 text-sm tracking-wider">NAVIGATION</h4>
          <div className="grid grid-cols-2 gap-x-8 text-sm">
            <ul className="space-y-2">
              <li><Link to="/#home" className="hover:underline">Home</Link></li>
              <li><Link to="/#about-section" className="hover:underline">About</Link></li>
              <li><Link to="/#services-section" className="hover:underline">Services</Link></li>
              <li><Link to="/#gallery" className="hover:underline">Gallery</Link></li>
              <li><Link to="/contact" className="hover:underline">Contact</Link></li>
            </ul>
            <ul className="space-y-2">
              <li><a href="#training" className="hover:underline">Training</a></li>
              <li><a href="#camps" className="hover:underline">Camps</a></li>
              <li><a href="#youth" className="hover:underline">Youth Program</a></li>
              <li><a href="#tournaments" className="hover:underline">Tournaments</a></li>
            </ul>
          </div>
        </div>
        
        {/* Programs */}
        <div>
          <h4 className="font-bold mb-4 text-sm tracking-wider">PROGRAMS</h4>
          <ul className="space-y-2 text-sm">
            <li>1-on-1 Training</li>
            <li>Group Sessions</li>
            <li>Holiday Camps</li>
            <li>Birthday Parties</li>
            <li>Grassroots Teams</li>
          </ul>
        </div>
        
        {/* Contact Us */}
        <div>
          <h4 className="font-bold mb-4 text-sm tracking-wider">CONTACT US</h4>
          <p className="text-sm mb-4">
            For all inquiries use <span className="font-semibold text-yellow-400">fsp@clubmail.com</span> or head over to our{' '}
            <Link to="/contact" className="text-yellow-400 hover:underline">contact</Link> page and send us a message.
          </p>
          <div className="flex space-x-4 mb-4">
            <a href="#" aria-label="Facebook" className="hover:text-yellow-400">
              <Facebook className="w-6 h-6" />
            </a>
            <a href="#" aria-label="YouTube" className="hover:text-yellow-400">
              <Youtube className="w-6 h-6" />
            </a>
            <a href="#" aria-label="Discord" className="hover:text-yellow-400">
              <MessageSquare className="w-6 h-6" />
            </a>
            <a href="#" aria-label="GitHub" className="hover:text-yellow-400">
              <Github className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
      <div className="flex justify-center py-4">
        <div className="h-8 w-8 bg-yellow-400 rounded-full flex items-center justify-center">
          <span className="text-neutral-800 font-bold text-xs">FSP</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 