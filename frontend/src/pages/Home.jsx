import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaGlobe, 
  FaBriefcase, 
  FaBook, 
  FaCalendarAlt, 
  FaHandshake, 
  FaLightbulb,
  FaRocket,
  FaUserGraduate,
  FaUsers,
  FaBookOpen,
  FaArrowRight,
  FaChartBar,
  FaTachometerAlt,
  FaTimes,
  FaQuestionCircle,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { MdWavingHand } from 'react-icons/md';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, isAuthenticated, getDashboardPath } = useAuth();
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);

  // Show user guide modal on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenUserGuide');
    if (!hasSeenGuide) {
      setShowUserGuideModal(true);
    }
  }, []);

  const handleCloseUserGuide = () => {
    setShowUserGuideModal(false);
    localStorage.setItem('hasSeenUserGuide', 'true');
  };

  const features = [
    {
      icon: <FaGlobe className="text-white text-2xl" />,
      title: 'Global Network',
      description: 'Connect with alumni worldwide and expand your professional network across industries.'
    },
    {
      icon: <FaBriefcase className="text-white text-2xl" />,
      title: 'Career Services',
      description: 'Access job opportunities, mentorship programs, and career development resources.'
    },
    {
      icon: <FaBook className="text-white text-2xl" />,
      title: 'Learning Hub',
      description: 'Continuous learning opportunities, workshops, and knowledge sharing sessions.'
    },
    {
      icon: <FaCalendarAlt className="text-white text-2xl" />,
      title: 'Events & Reunions',
      description: 'Stay updated with alumni events, reunions, and networking gatherings.'
    },
    {
      icon: <FaHandshake className="text-white text-2xl" />,
      title: 'Mentorship',
      description: 'Find mentors or become one. Guide the next generation of GB Pant College graduates.'
    },
    {
      icon: <FaLightbulb className="text-white text-2xl" />,
      title: 'Innovation Hub',
      description: 'Collaborate on projects, startups, and innovative ideas with fellow alumni.'
    }
  ];

  const stats = [
    { number: '5000+', label: 'Alumni Members' },
    { number: '50+', label: 'Countries' },
    { number: '100+', label: 'Companies' },
    { number: '20+', label: 'Years of Excellence' }
  ];

  const testimonials = [
    {
      name: 'Dr. Santosh Kumari',
      role: 'Manager, Tech Innovations',
      year: 'Class of 2014',
      content: 'The GB Pant College Alumni network opened doors I never knew existed. The connections and mentorship I received were invaluable.'
    },
    {
      name: 'Raj Patel',
      role: 'Senior Engineer, HCL',
      year: 'Class of 2015',
      content: 'Being part of this community helped me transition from student to professional seamlessly. The support is incredible.'
    },
    {
      name: 'Dr. Priya Sharma',
      role: 'Software Developer, PineGap',
      year: 'Class of 2008',
      content: 'The collaborative spirit of GB Pant College continues through this platform. It\'s amazing to see how we all support each other.'
    }
  ];

  return (
    <Layout showNav={true}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            {/* Main Hero Content */}
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-8">
                  <HiSparkles className="mr-2" /> Welcome to the GB Pant College Alumni Community
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Connect, Grow, and
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    {' '}Succeed Together
                  </span>
                </h1>
                
                <p className="text-xl text-indigo-100 mb-12 leading-relaxed max-w-3xl mx-auto">
                  Join thousands of GB Pant College Alumni in a vibrant community 
                  that fosters lifelong connections, career growth, and collaborative success.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                {isAuthenticated ? (
                  <Link
                    to={getDashboardPath()}
                    className="group px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
                    role="button"
                    aria-label="Go back to your dashboard"
                  >
                    <FaTachometerAlt />
                    <span>Back to Dashboard</span>
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="group px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
                      role="button"
                      aria-label="Join the GB Pant College Alumni community"
                    >
                      <FaRocket />
                      <span>Join the Community</span>
                      <FaArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    
                    <Link
                      to="/login"
                      className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-900 transition-all duration-200 flex items-center space-x-2"
                      role="button"
                      aria-label="Sign in to your account"
                    >
                      <MdWavingHand />
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl lg:text-4xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-indigo-200 text-sm uppercase tracking-wide">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M1200 120L0 16.48 0 0 1200 0 1200 120z" fill="#f8fafc"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why Join Our Alumni Network?
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Discover the benefits of being part of the GB Pant College alumni community and 
              unlock opportunities for personal and professional growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-slate-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              What Our Alumni Say
            </h2>
            <p className="text-xl text-slate-600">
              Hear from successful GB Pant College graduates about their experience with our community
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-50 p-8 rounded-2xl relative"
              >
                <div className="text-4xl text-indigo-200 mb-4">"</div>
                <p className="text-slate-700 mb-6 italic leading-relaxed">
                  {testimonial.content}
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                    <p className="text-sm text-slate-600">{testimonial.role}</p>
                    <p className="text-xs text-indigo-600 font-medium">{testimonial.year}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {isAuthenticated ? (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Welcome back, {user?.full_name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-xl text-indigo-100 mb-12">
                Continue exploring your alumni network and take advantage of all the features available to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={getDashboardPath()}
                  className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FaChartBar />
                  <span>Go to Dashboard</span>
                </Link>
                <Link
                  to={user?.user_type === 'student' ? '/alumni-list' : '/student-list'}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FaUsers />
                  <span>{user?.user_type === 'student' ? 'Browse Alumni' : 'Browse Students'}</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                Ready to Join the GB Pant DSEU Alumni Family?
              </h2>
              <p className="text-xl text-indigo-100 mb-12">
                Take the first step towards connecting with a global network of successful GB Pant college graduates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FaUserGraduate />
                  <span>Get Started Today</span>
                </Link>
                <Link
                  to="/about"
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-indigo-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FaBookOpen />
                  <span>Learn More</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* User Guide Modal */}
      {showUserGuideModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaQuestionCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">User Guide</h3>
              </div>
              <button
                onClick={handleCloseUserGuide}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Welcome to GB Pant Alumni Portal! 🎉
                </h4>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  New to the platform? Learn how to register and make the most of all the features available to connect with alumni and students.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <FaBookOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-900 mb-1">Complete User Guide</h5>
                      <p className="text-sm text-blue-700">
                        Step-by-step instructions for registration, profile setup, and using all platform features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-3">
                <a
                  href="https://drive.google.com/file/d/1YoExfzLVojZdjnmRbgWSoYv96_6t_C1V/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FaExternalLinkAlt className="w-4 h-4" />
                  <span>Click here to know more</span>
                </a>
                <button
                  onClick={handleCloseUserGuide}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  I'll explore on my own
                </button>
              </div>

              {/* Additional Tips */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 text-center">
                  💡 Tip: You can access this guide anytime from the help section
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
