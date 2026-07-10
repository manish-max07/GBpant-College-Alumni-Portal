import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const Network = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-6xl text-white mx-auto shadow-2xl">
              👥
            </div>
          </div>

          {/* Coming Soon Text */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Alumni Network
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-indigo-600 mb-4">
            Connect with GB Pant College Alumni
          </h2>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Discover and connect with fellow alumni from GB Pant College. 
            Build professional networks, find mentorship opportunities, and 
            collaborate with graduates from across different batches and departments.
          </p>

          {/* Conditional Action Button */}
          <div className="mb-12">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/alumni-list')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <span>👥</span>
                View Alumni Network
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-lg rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <span>🔐</span>
                Login to See Alumni Network
              </button>
            )}
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-semibold text-slate-900 mb-2">Connect</h3>
              <p className="text-sm text-slate-600">Find and connect with alumni from your batch and department</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">💼</div>
              <h3 className="font-semibold text-slate-900 mb-2">Opportunities</h3>
              <p className="text-sm text-slate-600">Discover job opportunities and career guidance from alumni</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="font-semibold text-slate-900 mb-2">Mentorship</h3>
              <p className="text-sm text-slate-600">Get mentorship or become a mentor for current students</p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12">
            <a
              href="/"
              className="inline-flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Home</span>
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Network;
