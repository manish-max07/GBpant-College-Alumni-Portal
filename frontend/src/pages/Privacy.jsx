import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const Privacy = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-slate-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl text-white mx-auto shadow-2xl">
                  🔒
                </div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Privacy Policy
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Your privacy and data protection are our top priorities
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 md:p-12">
            {/* Privacy Policy Content */}
            <div className="prose prose-lg max-w-none">
              <div className="text-center mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl text-white mx-auto mb-6 shadow-lg">
                  🛡️
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mb-4">
                  Our Commitment to Your Privacy
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  Last updated: August 25, 2025
                </p>
              </div>

              <div className="space-y-8">
                {/* Main Privacy Statement */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <span className="mr-3 text-2xl">💙</span>
                    We Value Your Privacy
                  </h3>
                  <p className="text-lg text-slate-700 leading-relaxed mb-6">
                    We value your privacy. The information you provide on this platform is used only to help you 
                    connect with GB Pant College students and alumni, and to plan community events.
                  </p>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                      <span className="mr-2">🔐</span>
                      Data Protection Promise
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      We do not share, sell, or disclose your personal data with any third parties.
                    </p>
                  </div>
                </div>

                {/* Purpose of Data Collection */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <span className="mr-3 text-2xl">🎯</span>
                    How We Use Your Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                      <div className="text-2xl mb-3">🤝</div>
                      <h4 className="font-semibold text-green-900 mb-2">Alumni Networking</h4>
                      <p className="text-green-800 text-sm">
                        Connect GB Pant College alumni with current students and fellow graduates
                      </p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                      <div className="text-2xl mb-3">📅</div>
                      <h4 className="font-semibold text-purple-900 mb-2">Event Planning</h4>
                      <p className="text-purple-800 text-sm">
                        Organize and coordinate community events and gatherings
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Agreement */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-200">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <span className="mr-3 text-2xl">📜</span>
                    Your Agreement
                  </h3>
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <p className="text-lg text-slate-700 leading-relaxed">
                      By using this platform, you agree to allow us to use your information solely for 
                      alumni networking and event-related purposes.
                    </p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
                    <span className="mr-3 text-2xl">ℹ️</span>
                    Additional Information
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold text-sm mt-1">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Data Security</h4>
                        <p className="text-slate-700">
                          We implement appropriate security measures to protect your personal information 
                          against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-600 font-semibold text-sm mt-1">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Data Control</h4>
                        <p className="text-slate-700">
                          You have the right to access, update, or delete your personal information at any time 
                          through your account settings or by contacting us.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-semibold text-sm mt-1">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">Community Focus</h4>
                        <p className="text-slate-700">
                          This platform is exclusively for the GB Pant College community to foster 
                          meaningful connections and organize educational and social events.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <span className="mr-3 text-2xl">📧</span>
                    Questions About This Policy?
                  </h3>
                  <p className="text-slate-300 mb-6">
                    If you have any questions or concerns about this privacy policy or how we handle your data, 
                    please don't hesitate to reach out to us.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a
                      href="/contact"
                      className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors text-center"
                    >
                      Contact Us
                    </a>
                    <a
                      href="https://github.com/manish-max07"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-center"
                    >
                      Developer GitHub
                    </a>
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

export default Privacy;
