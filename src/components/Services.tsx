import { Users2, BarChart3, Building2, Trophy } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Users2,
      title: "Dedicated Coaching",
      description: "Our professionals ensure each trainee gets personalized attention to grow at their pace."
    },
    {
      icon: BarChart3,
      title: "Performance Tracking",
      description: "We help monitor your progress and optimize your training with data-driven decisions."
    },
    {
      icon: Building2,
      title: "Modern Facilities",
      description: "Train with the best equipment and infrastructure designed to maximize performance."
    },
    {
      icon: Trophy,
      title: "Competitive Exposure",
      description: "Opportunities to participate in regional and national tournaments throughout the year."
    }
  ];

  return (
    <section id="services-section" className="bg-white py-16 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          How we help you
        </h2>
        <div className="w-24 h-1 mx-auto bg-blue-600 rounded mb-12"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center">
              <service.icon className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;