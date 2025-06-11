import React from 'react';
import { g1, g2, g3 } from "../constants/index";

const Gallery = () => {
  const galleryItems = [
    {
      image: g1,
      title: "Training Excellence",
      description: "Professional training sessions that push boundaries"
    },
    {
      image: g2,
      title: "Team Unity",
      description: "Building strong bonds through the beautiful game"
    },
    {
      image: g3,
      title: "Match Day",
      description: "Capturing the intensity of competitive play"
    }
  ];

  return (
    <section id="gallery" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">Our Gallery</h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Capturing the spirit and energy of FSP FC through our lens
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map((item, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl">
              <div className="aspect-w-4 aspect-h-3">
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="object-cover w-full h-64 transform transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-200">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery; 