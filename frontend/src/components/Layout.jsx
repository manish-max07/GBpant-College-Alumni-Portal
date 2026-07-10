import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { 
  FaHome, 
  FaBook, 
  FaUsers, 
  FaCalendarAlt, 
  FaEnvelope, 
  FaChartBar, 
  FaUserGraduate, 
  FaCog, 
  FaSignOutAlt,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaHeart
} from 'react-icons/fa';

const Layout = ({ children, showNav = true, showFooter = true }) => {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShakeAnimation, setShowShakeAnimation] = useState(true);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Stop shake animation after 10 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowShakeAnimation(false);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navigationLinks = [
    { name: 'Home', href: '/', icon: <FaHome /> },
    { name: 'About', href: '/about', icon: <FaBook /> },
    { name: 'Alumni Network', href: '/network', icon: <FaUsers /> },
    { name: 'Events', href: '/events', icon: <FaCalendarAlt /> },
    { name: 'Contact', href: '/contact', icon: <FaEnvelope /> },
  ];

  const userNavigationLinks = user
    ? [
        { name: 'Dashboard', href: user?.user_type === 'alumni' ? '/alumni-dashboard' : '/student-dashboard', icon: <FaChartBar /> },
        ...(user?.user_type === 'alumni' 
          ? [
              { name: 'Alumni List', href: '/alumni-list', icon: <FaUsers /> },
              { name: 'Student List', href: '/student-list', icon: <FaUserGraduate /> },
            ]
          : [
              { name: 'Alumni List', href: '/alumni-list', icon: <FaUsers /> },
            ]
        ),
        { name: 'Settings', href: '/settings', icon: <FaCog /> },
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {showNav && (
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex items-center">
                <Link to="/" className="group">
                  <img 
                    src="/logo1.png" 
                    alt="GBPANT Alumni Portal" 
                    className="h-16 sm:h-20 md:h-24 lg:h-40 w-auto object-contain group-hover:scale-105 transition-all duration-200"
                  />
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navigationLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-slate-100 ${
                      location.pathname === item.href
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center justify-center w-4 h-4 text-base">
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                ))}
              </div>

              {/* User Menu / Auth Buttons */}
              <div className="flex items-center space-x-4">
                {loading ? (
                  /* Show loading skeleton while checking authentication */
                  <div className="flex items-center space-x-3">
                    <div className="w-20 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                    <div className="w-16 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                  </div>
                ) : user ? (
                  <div className="relative" ref={menuRef}>
                    {/* Attention-grabbing animations wrapper */}
                    <div className="relative">
                      {/* Multiple attention-grabbing effects - conditional animations */}
                      {showShakeAnimation && (
                        <>
                          <div className="absolute -inset-2 bg-red-400 rounded-xl opacity-50 blur-md attention-pulse"></div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 rounded-xl opacity-70 animate-ping"></div>
                          <div className="absolute -inset-0.5 rounded-xl attention-glow"></div>
                          <div className="absolute -inset-1 border-2 rounded-xl attention-rainbow-border opacity-60"></div>
                        </>
                      )}
                      
                      {/* Permanent animated notification dots */}
                      <div className="absolute -top-2 -right-2 w-5 h-5 z-20">
                        <div className="w-full h-full bg-red-500 rounded-full attention-bounce-dot shadow-lg"></div>
                        <div className="absolute inset-0 w-full h-full bg-red-400 rounded-full animate-ping opacity-75"></div>
                        <div className="absolute inset-1 bg-red-600 rounded-full"></div>
                      </div>
                      
                      <button
                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                        className={`relative flex items-center space-x-3 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 z-10 ${
                          showShakeAnimation ? 'attention-shake' : ''
                        }`}
                        aria-expanded={isProfileMenuOpen}
                        aria-haspopup="true"
                        title="Click here to access Dashboard, Lists, and Settings!"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                          {user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block text-left">
                          <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.email || 'User'}</p>
                          <p className="text-xs text-slate-500">{user?.user_type ? (user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)) : 'User'}</p>
                        </div>
                        <svg
                          className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                            isProfileMenuOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Profile Dropdown */}
                    {isProfileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">{user?.full_name || user?.email || 'User'}</p>
                          <p className="text-sm text-slate-500">{user?.email || 'No email'}</p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                            {user?.user_type ? (user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1)) : 'User'}
                          </span>
                        </div>

                        {/* Enhanced New User Attention Banner - conditional */}
                        {showShakeAnimation && (
                          <div className="mx-2 my-2 p-3 bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-200 border-2 border-orange-300 rounded-lg attention-pulse shadow-lg">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-lg animate-bounce">👆</span>
                              <p className="text-xs text-orange-900 text-center font-bold">
                                Explore all features below!
                              </p>
                              <span className="text-lg animate-bounce animation-delay-400">✨</span>
                            </div>
                            <div className="mt-1 h-1 bg-gradient-to-r from-red-400 to-orange-400 rounded-full animate-pulse"></div>
                          </div>
                        )}

                        {userNavigationLinks.map((item, index) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={`relative flex items-center px-4 py-3 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-slate-900 transition-all duration-300 group rounded-lg mx-2 my-1 ${
                              index < 2 && showShakeAnimation ? 'attention-pulse hover:attention-glow' : ''
                            }`}
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            {/* Permanent blinking indicator for main features */}
                            {index < 2 && (
                              <>
                                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full attention-bounce-dot opacity-80 shadow-lg"></div>
                                <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-60"></div>
                              </>
                            )}
                            
                            {/* Conditional gradient highlight for important items */}
                            {index < 2 && showShakeAnimation && (
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 opacity-30 rounded-lg group-hover:opacity-60 transition-all duration-300 attention-glow"></div>
                            )}
                            
                            <span className={`mr-3 relative z-10 text-lg ${index < 2 && showShakeAnimation ? 'animate-bounce' : ''}`} style={{
                              animationDelay: `${index * 0.3}s`,
                              animationDuration: '2s'
                            }}>
                              {item.icon}
                            </span>
                            <span className="relative z-10 font-medium">{item.name}</span>
                            
                            {/* Changed back to "NEW" badge for first two items */}
                            {index < 2 && (
                              <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full animate-pulse shadow-lg font-bold">
                                NEW
                              </span>
                            )}
                            
                            {/* Conditional arrow indicator for main features */}
                            {index < 2 && showShakeAnimation && (
                              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 text-red-500 animate-bounce animation-delay-600">
                                →
                              </div>
                            )}
                          </Link>
                        ))}

                        <div className="border-t border-slate-100 mt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <FaSignOutAlt className="mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Link
                      to="/login"
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-all duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Join Now
                    </Link>
                  </div>
                )}

                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-expanded={isMobileMenuOpen}
                >
                  <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-slate-200 bg-white">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigationLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                        location.pathname === item.href
                          ? 'text-indigo-600 bg-indigo-50'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="flex items-center justify-center w-5 h-5 text-lg">
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  ))}
                  
                  {/* Mobile Auth Buttons - only show when user is not authenticated and not loading */}
                  {!loading && !user && (
                    <div className="border-t border-slate-200 pt-3 mt-3">
                      <Link
                        to="/login"
                        className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="mr-3">🚪</span>
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors mt-2"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="mr-3">🚀</span>
                        Join Now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  <FaUserGraduate />
                </div>
                <div>
                  <h3 className="text-lg font-bold">GBPANT Alumni</h3>
                  <p className="text-slate-400 text-sm">Portal</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connecting GB Pant College alumni and students worldwide, fostering a lifelong network of success and support.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-slate-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/network" className="text-slate-400 hover:text-white transition-colors">Alumni Network</Link></li>
                <li><Link to="/events" className="text-slate-400 hover:text-white transition-colors">Events</Link></li>
                <li><Link to="/careers" className="text-slate-400 hover:text-white transition-colors">Career Services</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/help" className="text-slate-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="text-slate-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-slate-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Connect</h4>
              <div className="flex space-x-4">
                <a 
                  href="https://www.linkedin.com/company/gb-pant-dseu-alumni-portal/?viewAsMember=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Connect on Facebook"
                >
                  <FaFacebookF />
                </a>
                <a 
                  href="https://www.linkedin.com/company/gb-pant-dseu-alumni-portal/?viewAsMember=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Connect on Twitter"
                >
                  <FaTwitter />
                </a>
                <a 
                  href="https://www.linkedin.com/company/gb-pant-dseu-alumni-portal/?viewAsMember=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Connect on LinkedIn"
                >
                  <FaLinkedinIn />
                </a>
                <a 
                  href="https://www.linkedin.com/company/gb-pant-dseu-alumni-portal/?viewAsMember=true" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-700 transition-colors"
                  aria-label="Connect on Instagram"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400 text-sm">
              © GB Pant College Alumni Portal. Made with <FaHeart className="inline text-red-500" /> by{' '}
              <a 
                href="https://www.linkedin.com/in/manish-kumar-35484a207/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline decoration-1 decoration-blue-400/50 hover:decoration-blue-300 transition-colors font-medium"
              >
                Manish
              </a>{' '}
              for alumni and current students
            </p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default Layout;
