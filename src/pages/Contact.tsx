import { useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const Contact = () => {
  const [formData, setFormData] = useState({
    playerName: '',
    age: '',
    experience: '',
    parentName: '',
    phone: '',
    email: '',
    service: '',
    days: [] as string[],
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      days: checked 
        ? [...prev.days, value]
        : prev.days.filter(day => day !== value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      alert('Thank you for your inquiry! We will contact you within 24 hours to discuss your training needs.');
      setFormData({
        playerName: '',
        age: '',
        experience: '',
        parentName: '',
        phone: '',
        email: '',
        service: '',
        days: [],
        message: ''
      });
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <>
      <Navigation />
      
      {/* Hero Section */}
      <section className="hero-gradient min-h-screen flex items-center pt-20 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-10 w-64 h-64 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-48 h-48 bg-yellow-400/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  GET IN <span className="text-yellow-400">TOUCH</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-lg leading-relaxed">
                  Ready to start your football journey? We're here to help you take the first step toward achieving your goals.
                </p>
              </div>

              {/* Contact Info Cards */}
              <div className="space-y-4">
                <div className="contact-card p-6 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Phone</h3>
                      <p className="text-gray-600">+233 XX XXX XXXX</p>
                    </div>
                  </div>
                </div>

                <div className="contact-card p-6 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <p className="text-gray-600">info@fspfc.com</p>
                    </div>
                  </div>
                </div>

                <div className="contact-card p-6 rounded-xl">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Location</h3>
                      <p className="text-gray-600">Accra, Ghana</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Contact Form */}
            <div className="contact-card p-8 rounded-2xl shadow-2xl my-2">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Start Your Journey</h2>
                <p className="text-gray-600">Fill out the form below and we'll get back to you within 24 hours.</p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Player Name */}
                <div>
                  <label htmlFor="playerName" className="block text-sm font-semibold text-gray-700 mb-2">Player Name *</label>
                  <input 
                    type="text" 
                    id="playerName" 
                    name="playerName" 
                    required
                    value={formData.playerName}
                    onChange={handleInputChange}
                    className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Enter the player's full name"
                  />
                </div>

                {/* Age */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                    <input 
                      type="number" 
                      id="age" 
                      name="age" 
                      min="5" 
                      max="18" 
                      required
                      value={formData.age}
                      onChange={handleInputChange}
                      className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="Age"
                    />
                  </div>
                  <div>
                    <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">Experience Level *</label>
                    <select 
                      id="experience" 
                      name="experience" 
                      required
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select level</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Parent/Guardian Contact */}
                <div>
                  <label htmlFor="parentName" className="block text-sm font-semibold text-gray-700 mb-2">Parent/Guardian Name *</label>
                  <input 
                    type="text" 
                    id="parentName" 
                    name="parentName" 
                    required
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="Full name of parent or guardian"
                  />
                </div>

                {/* Contact Details */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Service Interest */}
                <div>
                  <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">Interested Service *</label>
                  <select 
                    id="service" 
                    name="service" 
                    required
                    value={formData.service}
                    onChange={handleInputChange}
                    className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a service</option>
                    <option value="1on1">Special 1-on-1 Training</option>
                    <option value="group">Group Training Sessions</option>
                    <option value="holiday">Football Holiday Camps</option>
                    <option value="birthday">Birthday Parties</option>
                    <option value="grassroots">Grassroots Football Team</option>
                    <option value="consultation">General Consultation</option>
                  </select>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Training Days</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <label key={day} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          name="days" 
                          value={day} 
                          checked={formData.days.includes(day)}
                          onChange={handleCheckboxChange}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Additional Information</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows={4} 
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-input w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Tell us about your player's goals, any previous injuries, or special requirements..."
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  We'll contact you within 24 hours to discuss your training needs and schedule a consultation.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Why Choose FSP FC?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Certified Coaches</h3>
              <p className="text-gray-600">Our Level 1 & 2 certified coaches bring professional experience and passion to every session.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Individual Focus</h3>
              <p className="text-gray-600">Every player receives personalized attention to develop their unique strengths and abilities.</p>
            </div>
            
            <div className="p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Response</h3>
              <p className="text-gray-600">We respond to all inquiries within 24 hours and get you started on your journey quickly.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default Contact;