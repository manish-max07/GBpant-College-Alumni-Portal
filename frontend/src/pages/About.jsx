import React, { useState, useEffect } from 'react';
import { 
  FaUserGraduate, 
  FaStar, 
  FaBuilding, 
  FaTrophy, 
  FaChartBar, 
  FaLaptop, 
  FaBolt, 
  FaBook, 
  FaHeart,
  FaCog,
  FaCar,
  FaTools,
  FaWrench
} from 'react-icons/fa';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const About = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Placeholder images - you can replace these with actual image paths when you add them
  const carouselImages = [
    {
      src: '/photo1.jpg',
      alt: 'GB Pant DSEU Campus Main Building',
      title: 'Main Academic Complex'
    },
    {
      src: '/photo2.jpeg', 
      alt: 'GB Pant DSEU Library and Labs',
      title: 'GBPIT'
    },
    {
      src: '/photo3.jpg',
      alt: 'GB Pant DSEU Workshop Facilities',
      title: 'GB Pant Polytechnic and Engineering College'
    },
    {
      src: '/photo4.jpeg',
      alt: 'GB Pant Polytechnic and Engineering College',
      title: 'GB Pant Old Campus'
    },
    {
      src: '/logo1.png',
      alt: 'GB Pant DSEU Alumni Portal',
      title: 'Alumni Portal'
    }
  ];

  // Auto-slide functionality
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
      }, 5000); // Change slide every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, carouselImages.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                About GB Pant DSEU
              </h1>
              <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
                Two Campuses, One Vision - Unified Under DSEU
              </p>
              <div className="mt-8 flex items-center justify-center space-x-4 flex-wrap">
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">1961</div>
                  <div className="text-indigo-200 text-xs md:text-sm">Polytechnic Est.</div>
                </div>
                <div className="w-px h-8 md:h-12 bg-indigo-300"></div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">2007</div>
                  <div className="text-indigo-200 text-xs md:text-sm">Engg College Est.</div>
                </div>
                <div className="w-px h-8 md:h-12 bg-indigo-300"></div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">2025</div>
                  <div className="text-indigo-200 text-xs md:text-sm">Unified DSEU</div>
                </div>
                <div className="w-px h-8 md:h-12 bg-indigo-300"></div>
                <div className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">20.25</div>
                  <div className="text-indigo-200 text-xs md:text-sm">Acres Campus</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campus Carousel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Our Campus
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Explore our state-of-the-art facilities and vibrant campus life
            </p>
          </div>

          {/* Carousel */}
          <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="relative h-96 md:h-[500px] overflow-hidden">
              {/* Slides */}
              <div 
                className="flex transition-transform duration-500 ease-in-out h-full"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {carouselImages.map((image, index) => (
                  <div key={index} className="w-full flex-shrink-0 relative">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.target.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
                            <rect width="800" height="500" fill="#e2e8f0"/>
                            <text x="400" y="250" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="#64748b">
                              ${image.title}
                            </text>
                          </svg>
                        `)}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-2xl font-bold text-white mb-2">{image.title}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    currentSlide === index 
                      ? 'bg-white' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* About Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              {/* Historical Background */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="mr-3 text-2xl">🏛️</span>
                  Our Rich Heritage - Two Distinguished Institutions
                </h2>
                <div className="prose prose-lg text-slate-700 space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-4">
                    <h3 className="font-bold text-blue-900 mb-2">GB Pant Institute of Technology (Polytechnic)</h3>
                    <p className="mb-2">
                      Established in <strong>1961</strong>, GB Pant Institute of Technology is a premier polytechnic 
                      institute of the Government of NCT of Delhi. For over 60 years, it has been playing a vital 
                      role in technical education, renamed after the renowned freedom fighter 
                      <strong> Sh. Govind Ballabh Pant</strong>.
                    </p>
                    <p>
                      The polytechnic campus is spread over <strong>20.25 acres</strong> and consists of spacious 
                      academic complexes, residential facilities, workshops, EDUSAT facilities, ICT-equipped lecture 
                      theatres, and sports grounds with green areas.
                    </p>
                  </div>
                  
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <h3 className="font-bold text-green-900 mb-2">GB Pant Government Engineering College</h3>
                    <p>
                      Established in <strong>2007</strong>, GB Pant Government Engineering College emerged as a 
                      premier institution for undergraduate and postgraduate engineering programs. This college 
                      focused on providing quality engineering education with modern infrastructure and research 
                      facilities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Initiative Disclaimer */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <span className="mr-3 text-2xl">⚠️</span>
                  Important Note
                </h2>
                <div className="prose prose-lg text-slate-700 space-y-4">
                  <div className="bg-orange-100 border-l-4 border-orange-400 p-4 rounded-r-lg">
                    <p className="font-semibold text-orange-900 mb-3">
                      <strong>Disclaimer:</strong> This portal is not affiliated to DSEU or GB Pant College. 
                      This is an initiative by the students of GB Pant College to unify themselves across the globe under one network.
                    </p>
                    <p className="text-orange-800 text-sm">
                      Our mission is to connect alumni and students from both campuses - the polytechnic (established 1961) 
                      and the engineering college (established 2007) - now unified under DSEU, fostering a global community 
                      of GB Pant graduates.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                      <span className="mr-2">👨‍💻</span>
                      Connect with the Developer
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <a
                        href="https://www.linkedin.com/in/manish-kumar-35484a207/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn Profile
                      </a>
                      
                      <a
                        href="https://github.com/manish-max07"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors font-medium"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub Profile
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <FaBuilding className="mr-3 text-2xl text-purple-600" />
                  Unified Campus - GB Pant DSEU Okhla (2025)
                </h2>
                <div className="prose prose-lg text-slate-700 space-y-4">
                  <p className="font-semibold text-indigo-900 bg-indigo-100 p-4 rounded-lg">
                    <strong>Important Update (August 2025):</strong> The two separate institutions - 
                    GB Pant Institute of Technology (Polytechnic, established 1961) and GB Pant Government 
                    Engineering College (established 2007) - have now merged and operate as part of the unified 
                    <strong> GB Pant DSEU Okhla Campus</strong> under the Delhi Skill and Entrepreneurship University.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 my-6">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <h4 className="font-bold text-blue-900">Legacy Campus (1961)</h4>
                      <p className="text-sm text-blue-800">GB Pant Institute of Technology (Polytechnic)</p>
                      <p className="text-xs text-blue-700">Diploma Programs • 20.25 acres</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-lg">
                      <h4 className="font-bold text-green-900">Modern Campus (2007)</h4>
                      <p className="text-sm text-green-800">GB Pant Government Engineering College</p>
                      <p className="text-xs text-green-700">Degree Programs • Advanced Research</p>
                    </div>
                  </div>
                  
                  <p>
                    This unified campus now operates as G.B. Pant Delhi Skill and Entrepreneurship University - 
                    Okhla Campus, a premier public institution offering comprehensive technical education from 
                    diploma to postgraduate levels. The campus focuses on interdisciplinary learning, skill 
                    development, and provides state-of-the-art infrastructure with experienced faculty.
                  </p>
                  <p>
                    Located in the industrial hub of Okhla Phase III, the merged campus is well connected by 
                    public transport and provides easy accessibility. It offers a conducive environment for 
                    innovation, entrepreneurship, and hands-on training, helping students from both polytechnic 
                    and engineering backgrounds thrive in their academic and professional pursuits.
                  </p>
                </div>
              </div>

              {/* Success Stories */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                  <FaTrophy className="mr-3 text-2xl text-yellow-500" />
                  Our Pride
                </h2>
                <div className="prose prose-lg text-slate-700 space-y-4">
                  <p>
                    The enthusiasm of staff and students and the alumni of the Institute have done exceedingly 
                    well in all spheres of life and brought name and fame for themselves as well as to their 
                    Alma Mater. The vigor that I have observed among the faculty members of GBPIT is highly 
                    commendable.
                  </p>
                  <p>
                    With their unwavering commitment to impart necessary knowledge and skills they are 
                    unflinchingly trying to inspire the students to dream big by persuading them to achieve 
                    their goals.
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Facts */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <FaChartBar className="mr-2 text-indigo-600" />
                  Quick Facts
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600">Polytechnic Est.</span>
                    <span className="font-semibold text-slate-900">1961</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600">Engineering College Est.</span>
                    <span className="font-semibold text-slate-900">2007</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600">DSEU Merger</span>
                    <span className="font-semibold text-slate-900">2025</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600">Campus Area</span>
                    <span className="font-semibold text-slate-900">20.25 Acres</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-b-0">
                    <span className="text-slate-600">Location</span>
                    <span className="font-semibold text-slate-900">Okhla Phase III</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600">Current Status</span>
                    <span className="font-semibold text-slate-900">DSEU Campus</span>
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <FaBuilding className="mr-2 text-indigo-600" />
                  Academic Departments
                </h3>
                <div className="space-y-3">
                  {[
                    { name: 'Computer Science Engineering', icon: <FaLaptop className="text-blue-600" /> },
                    { name: 'Mechanical Engineering', icon: <FaCog className="text-gray-600" /> },
                    { name: 'Electrical Engineering', icon: <FaBolt className="text-yellow-500" /> },
                    { name: 'Electronics & Communication Engineering', icon: <FaChartBar className="text-green-600" /> },
                    { name: 'Automobile Engineering', icon: <FaCar className="text-red-600" /> }
                  ].map((dept, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-lg">{dept.icon}</span>
                      <span className="font-medium text-slate-900">{dept.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <FaBuilding className="mr-2 text-indigo-600" />
                  Campus Facilities
                </h3>
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center space-x-2">
                    <FaBook className="text-blue-600" />
                    <span>Modern Library & Labs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaTools className="text-gray-600" />
                    <span>Well-equipped Workshops</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaLaptop className="text-purple-600" />
                    <span>ICT Equipped Theatres</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🏠</span>
                    <span>Residential Complex</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>🏃</span>
                    <span>Sports & Recreation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>📡</span>
                    <span>EDUSAT Facilities</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default About;
