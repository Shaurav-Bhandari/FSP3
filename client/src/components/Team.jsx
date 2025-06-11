const Team = () => {
  const coaches = [
    {
      name: "Coach Anson Nyako",
      image: "/guy1.jpg",
      description: "Anson is a semi-professional athlete and a certified Level One coach with hands-on experience both on and off the field. His journey has given him a deep understanding of the game's physical demands, tactical complexities, and mental challenges. Anson is passionate about helping aspiring players unlock their full potential — he believes that with dedication and the right guidance, anyone can achieve their goals. He's committed to mentoring each player with focus, discipline, and unwavering support."
    },
    {
      name: "Coach Anson Kojo Agyeman",
      image: "/guy2.jpg",
      description: "Anson is a driven semi-professional footballer and a certified Level 2 coach who worked his way up from amateur levels. With a strong grasp of the game's physical, tactical, and mental aspects, he brings both passion and insight to his coaching. Football has shaped his life beyond the pitch — teaching him discipline, communication, and resilience — values he now strives to pass on. Anson believes that every child willing to try deserves a chance, and he's dedicated to helping them grow through tailored guidance and encouragement."
    }
  ];

  return (
    <section id="team-section" className="bg-gradient-to-b from-white to-gray-50 py-20">
      <h2 className="text-5xl md:text-7xl font-bold text-center text-gray-900 mb-6">
        Meet The <span className="text-yellow-500">Team</span>
      </h2>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 items-center gap-12">
        {/* Text Content */}
        <div>
          <p className="text-gray-700 text-lg mb-6">
            Our coaching team brings a wealth of experience and passion to the field.
            Whether you're new to football or aiming to go pro, our coaches are here
            to mentor, motivate, and guide you at every stage of your development.
          </p>

          <div className="space-y-6">
            {coaches.map((coach, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full overflow-hidden shadow flex-shrink-0">
                  <img 
                    src={coach.image} 
                    alt={coach.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-coach.jpg';
                    }}
                  />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{coach.name}</h4>
                  <p className="text-sm text-gray-600">
                    {coach.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="w-full">
          <div className="w-full h-80 rounded-2xl overflow-hidden shadow-lg">
            <img 
              src="/team-photo.jpg"
              alt="Coaching Team"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-team.jpg';
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="w-full my-8 flex justify-center items-center">
        <button className="bg-black text-white px-8 py-4 rounded-md text-base font-semibold hover:bg-gray-800 hover:scale-105 hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
          Learn More
        </button>
      </div>
    </section>
  );
};

export default Team; 