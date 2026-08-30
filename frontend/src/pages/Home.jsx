import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, isAuthenticated, getDashboardPath } = useAuth();
  const [showUserGuideModal, setShowUserGuideModal] = useState(false);

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

  const pillars = [
    {
      label: 'Global Network',
      description:
        'Connect with verified alumni across India and abroad spanning over two decades of engineering graduates from GBPIT and GBPEC.'
    },
    {
      label: 'Career Opportunities',
      description:
        'Discover job referrals, internship leads, and mentorship from senior alumni working across industries and geographies.'
    },
    {
      label: 'Mentorship Programme',
      description:
        'Offer guidance or find a mentor within the GB Pant community. Bridge the gap between student potential and professional success.'
    },
    {
      label: 'Professional Directory',
      description:
        'Browse a verified, searchable directory of alumni and current students filtered by batch, branch, company, and domain.'
    },
    {
      label: 'Knowledge Exchange',
      description:
        'Share expertise, participate in technical discussions, and contribute to the collective intelligence of the community.'
    },
    {
      label: 'Community Events',
      description:
        'Stay informed about reunions, industry talks, campus visits, and collaborative initiatives organised by the alumni body.'
    }
  ];

  const stats = [
    { value: '1,000+', label: 'Verified Members' },
    { value: '2007–2026', label: 'Batches Represented' },
    { value: '15+', label: 'Countries' },
    { value: '100+', label: 'Companies' }
  ];

  const testimonials = [
    {
      name: 'Santosh Kumari',
      credential: 'B.Tech ECE, 2014  —  Manager, Tech Innovations',
      quote:
        'The alumni network provided access to opportunities I would never have found on my own. The mentorship from senior graduates was instrumental in shaping my career trajectory.'
    },
    {
      name: 'Raj Patel',
      credential: 'B.Tech CSE, 2015  —  Senior Engineer, HCL Technologies',
      quote:
        'What sets this community apart is the willingness of alumni to give back. Within weeks of joining, I had three informational interviews lined up through the network.'
    },
    {
      name: 'Priya Sharma',
      credential: 'B.Tech IT, 2008  —  Software Developer, PineGap',
      quote:
        'The collaborative spirit of GB Pant College lives on through this platform. It is genuinely gratifying to see how graduates support one another years after leaving campus.'
    }
  ];

  return (
    <Layout showNav={true}>

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#0F172A] overflow-hidden">

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect x='0' y='0' width='1' height='40' fill='%23ffffff'/%3E%3Crect x='0' y='0' width='40' height='1' fill='%23ffffff'/%3E%3C/svg%3E\")"
          }}
        />

        {/* Accent glow — very subtle, top-right */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-blue-600 opacity-[0.07] blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-28 text-center">
          {/* Institution badge */}
          <div className="mb-8">
            <span className="inline-block text-xs font-semibold tracking-widest uppercase text-blue-400 border border-blue-800 bg-blue-950/60 px-4 py-1.5 rounded-full">
              GBPEC &amp; GBPIT — DSEU Okhla-1 Campus · Est. 1961
            </span>
          </div>

          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-white leading-[1.15] tracking-tight mb-6">
              The Official Alumni Network of<br />
              <span className="text-blue-400">G.B. Pant Engineering College</span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-10 max-w-2xl mx-auto">
              A professionally verified community for students and graduates of GB Pant
              Institute of Technology and GB Pant Engineering College. Reconnect, grow
              your career, and contribute to the legacy of one of Delhi's foremost
              engineering institutions.
            </p>

            {isAuthenticated ? (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  aria-label="Go to your dashboard"
                >
                  Go to Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to={user?.user_type === 'student' ? '/alumni-list' : '/student-list'}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                >
                  {user?.user_type === 'student' ? 'Browse Alumni' : 'Browse Students'}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  aria-label="Create your alumni account"
                >
                  Create an Account
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="mt-20 pt-10 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DIVIDER ──────────────────────────────────────────────────────── */}
      <div className="h-px bg-slate-200" />

      {/* ─── WHAT WE OFFER ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">Platform Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-4">
              Everything a professional alumni network should be
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Built specifically for the GB Pant college community — not a generic social network, but a focused professional resource for verified graduates and students.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="bg-white px-8 py-8 hover:bg-slate-50 transition-colors duration-200 group"
              >
                {/* Accent line */}
                <div className="w-8 h-0.5 bg-blue-600 mb-5 group-hover:w-12 transition-all duration-300" />
                <h3 className="text-base font-semibold text-slate-900 mb-3">{p.label}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-xs font-semibold tracking-widest text-blue-600 uppercase mb-3">Alumni Voices</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
              From the community
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Large quote mark */}
                <div className="text-5xl font-serif leading-none text-blue-100 select-none mb-4">&ldquo;</div>
                <p className="text-slate-700 text-sm leading-[1.8] mb-8 italic">
                  {t.quote}
                </p>
                <div className="border-t border-slate-100 pt-5 flex items-center gap-3">
                  {/* Avatar initials */}
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{t.credential}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
            <div className="max-w-2xl">
              {isAuthenticated ? (
                <>
                  <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Welcome back</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                    Good to see you, {user?.full_name?.split(' ')[0] || 'there'}.
                  </h2>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Continue building your profile, exploring the alumni directory, and engaging with the GB Pant community.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-3">Get Started</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                    Are you a GB Pant graduate or current student?
                  </h2>
                  <p className="text-slate-400 text-base leading-relaxed">
                    Join a growing network of engineers and professionals who studied at GBPIT and GBPEC. Membership is free, verified, and exclusive to the college community.
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[200px]">
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to={user?.user_type === 'student' ? '/alumni-list' : '/student-list'}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  >
                    {user?.user_type === 'student' ? 'Browse Alumni' : 'Browse Students'}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  >
                    Register Now
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white text-sm font-semibold rounded-lg transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── USER GUIDE MODAL ─────────────────────────────────────────────── */}
      {showUserGuideModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Welcome to GB Pant Alumni Portal</h3>
                <p className="text-xs text-slate-500 mt-0.5">First time here? Here is how to get started.</p>
              </div>
              <button
                onClick={handleCloseUserGuide}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md"
                aria-label="Close guide"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-6">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                This portal is exclusively for students and alumni of GB Pant Institute of Technology and GB Pant Engineering College. Registration requires a valid institutional email or roll number for verification.
              </p>

              <div className="space-y-3">
                <a
                  href="https://drive.google.com/file/d/1YoExfzLVojZdjnmRbgWSoYv96_6t_C1V/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  View User Guide
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={handleCloseUserGuide}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  I will explore on my own
                </button>
              </div>

              <p className="mt-5 text-xs text-slate-400 text-center">
                You can access this guide again from the Help section at any time.
              </p>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
