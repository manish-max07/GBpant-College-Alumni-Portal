import React from 'react';
import { 
  FaEnvelope, 
  FaHeart, 
  FaBullseye, 
  FaHandshake, 
  FaCalendarAlt 
} from 'react-icons/fa';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const Contact = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl text-white mx-auto shadow-2xl">
                  <FaEnvelope />
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Contact
              </h1>
              <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                Get in touch with us or learn more about the developer behind this platform
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Developer Message */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12 mb-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center text-3xl text-white mx-auto mb-6 shadow-lg">
                <FaHeart />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                Made with Love
              </h2>
            </div>
            
            <div className="prose prose-xl text-center max-w-none">
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8">
                Made with love by{' '}
                <a 
                  href="https://www.linkedin.com/in/manish-kumar-35484a207/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 underline decoration-2 decoration-indigo-300 hover:decoration-indigo-500 transition-colors"
                >
                  Manish
                </a>{' '}
                for alumni and current students to connect and plan virtual events and offline events.
              </p>
              
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center">
                  <FaBullseye className="mr-2 text-indigo-600" />
                  Vision & Purpose
                </h3>
                <p className="text-slate-700 mb-6">
                  This platform was created to bridge the gap between GB Pant College alumni and current students, 
                  fostering meaningful connections, mentorship opportunities, and community engagement through 
                  both virtual and offline events.
                </p>
                <div className="grid md:grid-cols-2 gap-6 text-left">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2 text-blue-600">
                      <FaHandshake />
                    </div>
                    <h4 className="font-semibold text-slate-900">Connect</h4>
                    <p className="text-sm text-slate-600">Alumni and students networking</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="text-2xl mb-2 text-green-600">
                      <FaCalendarAlt />
                    </div>
                    <h4 className="font-semibold text-slate-900">Events</h4>
                    <p className="text-sm text-slate-600">Virtual and offline gatherings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Developer Info */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* GitHub Card */}
            <div className="bg-slate-900 rounded-2xl p-8 text-white">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-4 border-white/20">
                  <img 
                    src="/profile.png" 
                    alt="Manish - Developer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Developer</h3>
                  <p className="text-slate-300">Manish</p>
                </div>
              </div>
              
              <p className="text-slate-300 mb-6">
                Passionate about building platforms that bring communities together and create meaningful connections.
              </p>
              
              <a
                href="https://github.com/manish-max07"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-white text-slate-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                <span>Visit GitHub Profile</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* LinkedIn Card */}
            <div className="bg-blue-700 rounded-2xl p-8 text-white">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-4 border-white/20">
                  <img 
                    src="/profile.png" 
                    alt="Manish - Developer" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Professional</h3>
                  <p className="text-blue-200">Manish Kumar</p>
                </div>
              </div>
              
              <p className="text-blue-200 mb-6">
                Connect with me professionally and stay updated with my career journey and projects.
              </p>
              
              <a
                href="https://www.linkedin.com/in/manish-kumar-35484a207/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-3 bg-white text-blue-700 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                </svg>
                <span>Visit LinkedIn Profile</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-3">📧</span>
                Get in Touch
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">For Technical Issues</h4>
                  <p className="text-indigo-100 text-sm">
                    If you encounter any bugs or technical problems, please report them on GitHub.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Feature Suggestions</h4>
                  <p className="text-indigo-100 text-sm">
                    Have ideas to improve the platform? We'd love to hear your feedback!
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Alumni Community</h4>
                  <p className="text-indigo-100 text-sm">
                    Join our growing community of GB Pant College alumni and students.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-indigo-300">
                <p className="text-indigo-100 text-sm">
                  <span className="font-semibold">Built with:</span> React, Tailwind CSS, Node.js, PostgreSQL
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Join the Community</h3>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
              Whether you're an alumni or current student, this platform is designed to help you connect, 
              grow, and contribute to the GB Pant College Alumni community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Join as Alumni
              </a>
              <a
                href="/signup"
                className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
              >
                Join as Student
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
