import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

const Events = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <Layout showNav={true}>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-6xl text-white mx-auto shadow-2xl">
              📅
            </div>
          </div>

          {/* Coming Soon Text */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6">
            Coming Soon
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-semibold text-purple-600 mb-4">
            Alumni Events
          </h2>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            We're planning exciting events, reunions, and workshops for the GB Pant College Alumni community. 
            Stay tuned for announcements about upcoming alumni gatherings, career fairs, 
            and networking events.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="font-semibold text-slate-900 mb-2">Reunions</h3>
              <p className="text-sm text-slate-600">Annual reunions and batch meetups</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-semibold text-slate-900 mb-2">Career Fairs</h3>
              <p className="text-sm text-slate-600">Job fairs and recruitment drives</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="text-3xl mb-3">📚</div>
              <h3 className="font-semibold text-slate-900 mb-2">Workshops</h3>
              <p className="text-sm text-slate-600">Skill development and training sessions</p>
            </div>
          </div>

          {/* Subscribe for Updates */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white">
            <h3 className="text-xl font-semibold mb-4">Don't miss upcoming events!</h3>
            <p className="text-purple-100 mb-6">
              Subscribe to get notified about all GB Pant College alumni events and activities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              <button className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-slate-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12">
            <a
              href="/"
              className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
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

export default Events;
