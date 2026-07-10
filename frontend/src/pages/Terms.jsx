import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const Terms = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Terms of Service
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto"></div>
          </div>

          {/* Terms Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            <div className="space-y-8">
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-indigo-800 mb-3">Platform Eligibility</h2>
                <p className="text-gray-700 leading-relaxed">
                  This platform is for GB Pant College alumni and students only.
                </p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-purple-800 mb-3">Community Guidelines</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Use it to connect, share, and participate respectfully.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Do not post false, offensive, or harmful content.
                </p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-green-800 mb-3">Data Usage</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Your data is used only for alumni connections and events.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  We do not share your personal data with third parties.
                </p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-orange-800 mb-3">User Responsibility</h2>
                <p className="text-gray-700 leading-relaxed">
                  You are responsible for what you post and share.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-red-800 mb-3">Liability & Events</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  The alumni network is not liable for member posts or actions.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Event participation is voluntary and at your own risk.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                <h2 className="text-xl font-semibold text-yellow-800 mb-3">Account Management</h2>
                <p className="text-gray-700 leading-relaxed">
                  Accounts may be removed if rules are violated.
                </p>
              </div>

              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-3">Agreement</h2>
                <p className="leading-relaxed">
                  By using this site, you agree to these terms.
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">
                Questions about these terms? Contact us:
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
                <a 
                  href="mailto:contact@gbpantalumni.com" 
                  className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
                >
                  alumniportal.gbpant@gmail.com
                </a>
                <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">GB Pant Alumni Network</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;
