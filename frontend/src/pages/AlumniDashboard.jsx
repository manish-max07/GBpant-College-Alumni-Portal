import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import PhoneInput from '../components/PhoneInput';
import ProfilePicture from '../components/ProfilePicture';
import { 
  FaUser, 
  FaEdit, 
  FaGraduationCap, 
  FaChartLine, 
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBriefcase,
  FaBuilding,
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaAward,
  FaStar,
  FaGem,
  FaChevronRight,
  FaTrophy,
  FaCog,
  FaLightbulb,
  FaRocket,
  FaSave,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaBirthdayCake,
  FaExternalLinkAlt,
  FaClock,
  FaUserGraduate,
  FaHandshake,
  FaNetworkWired,
  FaUniversity
} from 'react-icons/fa';
import { HiOutlineAcademicCap, HiOutlineBriefcase } from 'react-icons/hi';
import { MdWavingHand } from 'react-icons/md';

export default function AlumniDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  // Check if welcome modal should be shown for alumni
  useEffect(() => {
    if (profile?.profile && !loading) {
      const hasLinkedIn = profile.profile.linkedInProfile; // Fixed: using correct property name
      
      // Show modal if alumni doesn't have LinkedIn profile
      if (!hasLinkedIn) {
        setShowWelcomeModal(true);
      } else {
        setShowWelcomeModal(false);
      }
    }
  }, [profile, loading]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/api/profile/alumni', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Transform snake_case to camelCase for frontend consumption
      if (response.data.success && response.data.profile) {
        const profile = response.data.profile;
        const transformedProfile = {
          ...profile,
          fullName: profile.full_name,
          passingYear: profile.passing_year,
          isEmployed: profile.is_employed,
          linkedInProfile: profile.linkedin_profile,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          websiteUrl: profile.website_url,
          githubProfile: profile.github_profile,
          previousCampus: profile.previous_campus,
          // Transform higher education fields
          currentInstitution: profile.current_institution,
          currentCourse: profile.current_course,
          institutionCountry: profile.institution_country,
          isPursuingHigherEducation: profile.is_pursuing_higher_education,
          expectedGraduationYear: profile.expected_graduation_year,
          // Transform additional status fields
          isPreparingCompetitiveExams: profile.is_preparing_competitive_exams,
          competitiveExamDetails: profile.competitive_exam_details,
          isSeekingOpportunities: profile.is_seeking_opportunities,
          opportunityPreferences: profile.opportunity_preferences
        };
        setProfile({ ...response.data, profile: transformedProfile });
      } else {
        setProfile(response.data);
      }
    } catch (error) {
      toast.error('Failed to load profile');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Let ProtectedRoute handle redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = useCallback(async (updatedData) => {
    try {
      const token = localStorage.getItem('token');
      
      // Transform camelCase to snake_case for API
      const apiData = {
        full_name: updatedData.fullName,
        age: updatedData.age,
        branch: updatedData.branch,
        program: updatedData.program,
        passing_year: updatedData.passingYear,
        is_employed: updatedData.isEmployed,
        employer: updatedData.employer,
        position: updatedData.position,
        experience: updatedData.experience,
        linkedin_profile: updatedData.linkedInProfile,
        location: updatedData.location,
        previous_campus: updatedData.previousCampus,
        // Higher education fields
        current_institution: updatedData.currentInstitution,
        current_course: updatedData.currentCourse,
        institution_country: updatedData.institutionCountry,
        is_pursuing_higher_education: updatedData.isPursuingHigherEducation,
        expected_graduation_year: updatedData.expectedGraduationYear,
        // Additional status fields
        is_preparing_competitive_exams: updatedData.isPreparingCompetitiveExams,
        competitive_exam_details: updatedData.competitiveExamDetails,
        is_seeking_opportunities: updatedData.isSeekingOpportunities,
        opportunity_preferences: updatedData.opportunityPreferences
      };
      
      const response = await api.put('/api/profile/alumni', apiData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Check if the response indicates success
      if (response.data && response.data.success) {
        // Transform the API response back to camelCase for frontend
        const updatedProfile = {
          ...updatedData,
          fullName: updatedData.fullName,
          passingYear: updatedData.passingYear,
          isEmployed: updatedData.isEmployed,
          linkedInProfile: updatedData.linkedInProfile,
          previousCampus: updatedData.previousCampus,
          isPursuingHigherEducation: updatedData.isPursuingHigherEducation,
          currentInstitution: updatedData.currentInstitution,
          currentCourse: updatedData.currentCourse,
          institutionCountry: updatedData.institutionCountry,
          expectedGraduationYear: updatedData.expectedGraduationYear,
          // Additional status fields
          isPreparingCompetitiveExams: updatedData.isPreparingCompetitiveExams,
          competitiveExamDetails: updatedData.competitiveExamDetails,
          isSeekingOpportunities: updatedData.isSeekingOpportunities,
          opportunityPreferences: updatedData.opportunityPreferences
        };
        
        setProfile(prevProfile => ({ 
          ...prevProfile, 
          profile: { ...prevProfile?.profile, ...updatedProfile } 
        }));
        setEditing(false);
        
        // Check if LinkedIn is now filled and close welcome modal
        if (updatedData.linkedInProfile) {
          setShowWelcomeModal(false);
        }
        
        toast.success('Profile updated successfully');
      } else {
        // API returned success: false
        toast.error(response.data?.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      toast.error(errorMessage);
    }
  }, [profile]);

  const handleDismissModal = useCallback(() => {
    // Only close modal for current session, don't permanently dismiss
    setShowWelcomeModal(false);
  }, []);

  const handleViewStudents = useCallback(() => {
    setShowWelcomeModal(false);
    navigate('/student-list');
  }, [navigate]);

  const handleViewAlumni = useCallback(() => {
    setShowWelcomeModal(false);
    navigate('/alumni-list');
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Layout showNav={false}>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse shadow-2xl border border-gray-100">
                <img 
                  src="/logo1.png" 
                  alt="GB Pant Alumni Portal" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              </div>
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-6"></div>
              <p className="text-slate-700 font-semibold text-lg sm:text-xl">Loading your dashboard...</p>
              <p className="text-slate-500 text-sm sm:text-base mt-2">Preparing your alumni profile</p>
            </div>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 flex-1">
                <div className="relative">
                  <ProfilePicture size="xlarge" className="shadow-2xl" />
                  {profile?.profile?.isEmployed && (
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white z-10">
                      <FaBriefcase className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                    Welcome back, {profile?.profile?.fullName?.split(' ')[0] || 'Alumni'}!
                    <MdWavingHand className="ml-2 inline text-yellow-300" />
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-indigo-100 text-sm sm:text-base mb-4">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineAcademicCap className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>GB Pant College Alumni</span>
                    </div>
                    <span className="hidden sm:inline text-indigo-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <FaGraduationCap className="w-4 h-4" />
                      <span>Class of {profile?.profile?.passingYear || '----'}</span>
                    </div>
                    <span className="hidden sm:inline text-indigo-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <FaMapMarkerAlt className="w-4 h-4" />
                      <span>{profile?.profile?.location || 'Location not set'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Employment Status */}
                    {profile?.profile?.isEmployed && (
                      <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm border bg-green-500/20 border-green-300/30 text-green-100">
                        <FaBriefcase className="w-4 h-4 mr-2" />
                        <span className="text-sm sm:text-base font-semibold">Employed</span>
                      </div>
                    )}
                    
                    {/* Higher Education Status */}
                    {profile?.profile?.isPursuingHigherEducation && (
                      <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm border bg-purple-500/20 border-purple-300/30 text-purple-100">
                        <HiOutlineAcademicCap className="w-4 h-4 mr-2" />
                        <span className="text-sm sm:text-base font-semibold">Student</span>
                      </div>
                    )}
                    
                    {/* Competitive Exam Preparation Status */}
                    {profile?.profile?.isPreparingCompetitiveExams && (
                      <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm border bg-orange-500/20 border-orange-300/30 text-orange-100">
                        <FaLightbulb className="w-4 h-4 mr-2" />
                        <span className="text-sm sm:text-base font-semibold">Exam Aspirant</span>
                      </div>
                    )}
                    
                    {/* Seeking Opportunities Status */}
                    {profile?.profile?.isSeekingOpportunities && (
                      <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm border bg-blue-500/20 border-blue-300/30 text-blue-100">
                        <FaHandshake className="w-4 h-4 mr-2" />
                        <span className="text-sm sm:text-base font-semibold">Job Seeker</span>
                      </div>
                    )}
                    
                    {/* Default status if no status is selected */}
                    {!profile?.profile?.isEmployed && !profile?.profile?.isPursuingHigherEducation && 
                     !profile?.profile?.isPreparingCompetitiveExams && !profile?.profile?.isSeekingOpportunities && (
                      <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm border bg-gray-500/20 border-gray-300/30 text-gray-100">
                        <FaCog className="w-4 h-4 mr-2" />
                        <span className="text-sm sm:text-base font-semibold">Available</span>
                      </div>
                    )}
                    
                    {profile?.profile?.isEmployed && profile?.profile?.employer && (
                      <div className="flex items-center text-indigo-200 text-sm sm:text-base">
                        <FaBuilding className="w-4 h-4 mr-2" />
                        <span className="truncate max-w-48">{profile.profile.employer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white rounded-2xl hover:bg-white/25 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl"
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                        <FaUser className="w-4 h-4 text-indigo-600" />
                      </div>
                      Profile Information
                    </h2>
                    {!editing && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <FaEdit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  {editing ? (
                    <EditProfileForm
                      profile={profile?.profile}
                      onSave={handleSave}
                      onCancel={() => setEditing(false)}
                    />
                  ) : (
                    <ProfileView profile={profile?.profile} />
                  )}
                </div>
              </div>

              {/* Professional Experience */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                    <HiOutlineBriefcase className="w-4 h-4 text-purple-600" />
                  </div>
                  Professional Experience
                </h3>
                
                <div className="prose prose-slate max-w-none">
                  {profile?.profile?.experience ? (
                    <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
                        {profile.profile.experience}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FaLightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">Share Your Journey</h4>
                      <p className="text-slate-500 mb-6 text-sm sm:text-base max-w-md mx-auto">
                        Help fellow alumni and students by sharing your professional experience and insights.
                      </p>
                      <button
                        onClick={handleEdit}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 font-semibold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <FaEdit className="w-4 h-4" />
                        Add Your Experience
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Quick Stats */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <FaChartLine className="w-4 h-4 text-blue-600" />
                  </div>
                  Quick Stats
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all">
                    <div className="flex items-center gap-3">
                      <FaGraduationCap className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Graduation Year</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profile?.profile?.passingYear || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all">
                    <div className="flex items-center gap-3">
                      <FaClock className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Experience</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profile?.profile?.passingYear 
                        ? `${new Date().getFullYear() - profile.profile.passingYear} years`
                        : '-'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Member Since</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profile?.profile?.createdAt 
                        ? new Date(profile.profile.createdAt).getFullYear() 
                        : '-'
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl hover:from-blue-50 hover:to-indigo-50 transition-all">
                    <div className="flex items-center gap-3">
                      <FaBriefcase className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Status</span>
                    </div>
                    <span className={`font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-2 ${
                      profile?.profile?.isEmployed 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}>
                      {profile?.profile?.isEmployed ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Employed
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                          Open to Work
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                    <FaRocket className="w-4 h-4 text-green-600" />
                  </div>
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/student-list')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FaUsers className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Student List</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button 
                    onClick={handleViewAlumni}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                        <FaUsers className="w-5 h-5 text-teal-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Alumni List</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <FaCalendarAlt className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Upcoming Events</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                        <FaBriefcase className="w-5 h-5 text-indigo-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Job Board</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <FaHandshake className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Mentorship</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>

              {/* Alumni Spotlight */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
                    <FaGem className="w-6 h-6 mr-3" />
                    Alumni Spotlight
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base mb-6 leading-relaxed">
                    Share your success story and inspire fellow alumni and current students with your journey.
                  </p>
                  <button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold border border-white/30 hover:border-white/50">
                    <FaGem className="w-5 h-5" />
                    <span>Share Your Story</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal for Alumni */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white relative">
              <button
                onClick={handleDismissModal}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-all duration-200"
              >
                <FaTimes className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                  <FaUsers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Welcome Alumni!</h3>
                  <p className="text-indigo-100 text-sm">Complete your profile</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">
                  Add your LinkedIn profile
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Please add your LinkedIn profile link to help current students connect with you and build their professional network.
                </p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FaLinkedin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Professional Networking</p>
                      <p className="text-slate-600 text-xs">Help students connect with industry professionals</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaUsers className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Mentor Students</p>
                      <p className="text-slate-600 text-xs">Guide current students in their career journey</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleViewStudents}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaUsers className="w-4 h-4" />
                  See Student List
                </button>
                
                <button
                  onClick={handleViewAlumni}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaUsers className="w-4 h-4" />
                  See Alumni List
                </button>
                
                <button
                  onClick={() => {
                    handleDismissModal();
                    setEditing(true);
                  }}
                  className="w-full bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Profile Now
                </button>
              </div>

              <p className="text-xs text-slate-500 text-center mt-4">
                This notification will appear until you add your LinkedIn profile
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
    </>
  );
}

function ProfileView({ profile }) {
  const profileFields = [
    { label: 'Full Name', key: 'fullName', icon: FaUser, color: 'blue' },
    { label: 'Age', key: 'age', icon: FaBirthdayCake, color: 'pink' },
    { label: 'Branch', key: 'branch', icon: FaCog, color: 'green' },
    { label: 'Program', key: 'program', icon: FaGraduationCap, color: 'purple' },
    { label: 'Passing Year', key: 'passingYear', icon: FaUserGraduate, color: 'indigo' },
    { label: 'Previous Campus', key: 'previousCampus', icon: FaUniversity, color: 'teal' },
    { label: 'Location', key: 'location', icon: FaMapMarkerAlt, color: 'red' },
  ];

  const professionalFields = [
    { 
      label: 'Employment Status', 
      key: 'isEmployed', 
      icon: FaBriefcase, 
      color: 'teal',
      render: (value) => value ? 'Currently Employed' : 'Open to Opportunities' 
    },
    ...(profile?.isEmployed ? [
      { label: 'Current Employer', key: 'employer', icon: FaBuilding, color: 'blue' },
      { label: 'Position', key: 'position', icon: FaAward, color: 'yellow' },
    ] : []),
    { 
      label: 'LinkedIn Profile', 
      key: 'linkedInProfile', 
      icon: FaLinkedin, 
      color: 'blue',
      render: (value) => value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
        >
          <span>View Profile</span>
          <FaExternalLinkAlt className="w-3 h-3" />
        </a>
      ) : 'Not provided'
    },
  ];

  const higherEducationFields = [
    {
      label: 'Pursuing Higher Education',
      key: 'isPursuingHigherEducation',
      icon: HiOutlineAcademicCap,
      color: 'purple',
      render: (value) => value ? 'Yes' : 'No'
    },
    ...(profile?.isPursuingHigherEducation ? [
      { label: 'Current Institution', key: 'currentInstitution', icon: FaBuilding, color: 'indigo' },
      { label: 'Course/Program', key: 'currentCourse', icon: FaGraduationCap, color: 'blue' },
      { label: 'Institution Country', key: 'institutionCountry', icon: FaMapMarkerAlt, color: 'green' },
      { label: 'Expected Graduation', key: 'expectedGraduationYear', icon: FaCalendarAlt, color: 'orange' },
    ] : []),
  ];

  const competitiveExamFields = [
    {
      label: 'Preparing for Competitive Exams',
      key: 'isPreparingCompetitiveExams',
      icon: FaLightbulb,
      color: 'orange',
      render: (value) => value ? 'Yes' : 'No'
    },
    ...(profile?.isPreparingCompetitiveExams ? [
      { 
        label: 'Exam Details', 
        key: 'competitiveExamDetails', 
        icon: FaGraduationCap, 
        color: 'orange',
        render: (value) => (
          <div className="text-sm text-gray-700 leading-relaxed">
            {value || 'No details provided'}
          </div>
        )
      },
    ] : []),
  ];

  const opportunityFields = [
    {
      label: 'Seeking Opportunities',
      key: 'isSeekingOpportunities',
      icon: FaHandshake,
      color: 'green',
      render: (value) => value ? 'Yes' : 'No'
    },
    ...(profile?.isSeekingOpportunities ? [
      { 
        label: 'Opportunity Preferences', 
        key: 'opportunityPreferences', 
        icon: FaBriefcase, 
        color: 'green',
        render: (value) => (
          <div className="text-sm text-gray-700 leading-relaxed">
            {value || 'No preferences specified'}
          </div>
        )
      },
    ] : []),
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  const renderField = (field) => {
    const value = profile?.[field.key];
    const displayValue = field.render ? field.render(value) : (value || '-');
    const IconComponent = field.icon;
    
    return (
      <div key={field.key} className="group bg-gradient-to-r from-slate-50 to-indigo-50 hover:from-indigo-50 hover:to-purple-50 rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${colorClasses[field.color]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              {field.label}
            </label>
            <div className="text-slate-900 font-bold text-lg leading-tight">
              {displayValue}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
            <FaUser className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Personal Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {profileFields.map(renderField)}
        </div>
      </div>

      {/* Professional Information */}
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
            <FaBriefcase className="w-4 h-4 text-purple-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Professional Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {professionalFields.map(renderField)}
        </div>
      </div>

      {/* Higher Education Information */}
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
            <HiOutlineAcademicCap className="w-4 h-4 text-indigo-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Higher Education</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {higherEducationFields.map(renderField)}
        </div>
      </div>

      {/* Competitive Exam Preparation */}
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
            <FaLightbulb className="w-4 h-4 text-orange-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Competitive Exam Preparation</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {competitiveExamFields.map(renderField)}
        </div>
      </div>

      {/* Opportunity Seeking */}
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
            <FaHandshake className="w-4 h-4 text-green-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Opportunity Seeking</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {opportunityFields.map(renderField)}
        </div>
      </div>
    </div>
  );
}

// AlumniInputField component moved outside to prevent re-creation on every render  
const AlumniInputField = React.memo(({ icon: Icon, label, name, type = "text", children, error, description, formData, handleChange }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <Icon className="w-4 h-4 text-slate-500" />
      {label}
    </label>
    <div className="relative">
      {children || (
        <input
          type={type}
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className={`w-full px-4 py-3 sm:py-4 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
      )}
      {error && (
        <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-500 text-xs">
          <FaExclamationTriangle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
    {description && (
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    )}
  </div>
));

const EditProfileForm = React.memo(({ profile, onSave, onCancel }) => {
  const [showCustomBranch, setShowCustomBranch] = useState(false);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    age: profile?.age || '',
    branch: profile?.branch || '',
    program: profile?.program || '',
    customBranch: '', // For custom branch entry
    customProgram: '', // For custom program entry
    passingYear: profile?.passingYear || '',
    isEmployed: profile?.isEmployed || false,
    employer: profile?.employer || '',
    position: profile?.position || '',
    experience: profile?.experience || '',
    linkedInProfile: profile?.linkedInProfile || '',
    location: profile?.location || '',
    previousCampus: profile?.previousCampus || '',
    // Higher education fields
    isPursuingHigherEducation: profile?.isPursuingHigherEducation || false,
    currentInstitution: profile?.currentInstitution || '',
    currentCourse: profile?.currentCourse || '',
    institutionCountry: profile?.institutionCountry || '',
    expectedGraduationYear: profile?.expectedGraduationYear || '',
    // Additional status fields
    isPreparingCompetitiveExams: profile?.isPreparingCompetitiveExams || false,
    competitiveExamDetails: profile?.competitiveExamDetails || '',
    isSeekingOpportunities: profile?.isSeekingOpportunities || false,
    opportunityPreferences: profile?.opportunityPreferences || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    
    // Handle "OTHER" selection for branch
    if (name === 'branch') {
      if (value === 'OTHER') {
        setShowCustomBranch(true);
        setFormData(prev => ({
          ...prev,
          [name]: '',
          customBranch: ''
        }));
      } else {
        setShowCustomBranch(false);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customBranch: ''
        }));
      }
      // Clear error when user changes selection
      setErrors(prev => {
        if (prev[name]) {
          return { ...prev, [name]: '' };
        }
        return prev;
      });
      return;
    }
    
    // Handle "OTHER" selection for program
    if (name === 'program') {
      if (value === 'OTHER') {
        setShowCustomProgram(true);
        setFormData(prev => ({
          ...prev,
          [name]: '',
          customProgram: ''
        }));
      } else {
        setShowCustomProgram(false);
        setFormData(prev => ({
          ...prev,
          [name]: value,
          customProgram: ''
        }));
      }
      // Clear error when user changes selection
      setErrors(prev => {
        if (prev[name]) {
          return { ...prev, [name]: '' };
        }
        return prev;
      });
      return;
    }
    
    // Default handling for other fields
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    setErrors(prev => {
      if (prev[name]) {
        return { ...prev, [name]: '' };
      }
      return prev;
    });
  }, []); // No dependencies needed!

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (formData.age && (parseInt(formData.age) < 18 || parseInt(formData.age) > 100)) {
      newErrors.age = 'Age must be between 18 and 100';
    }
    if (formData.passingYear && (parseInt(formData.passingYear) < 1950 || parseInt(formData.passingYear) > new Date().getFullYear())) {
      newErrors.passingYear = 'Please enter a valid passing year';
    }
    if (formData.linkedInProfile && !formData.linkedInProfile.includes('linkedin.com')) {
      newErrors.linkedInProfile = 'Please enter a valid LinkedIn URL';
    }
    if (formData.isEmployed) {
      if (!formData.employer.trim()) newErrors.employer = 'Employer is required when employed';
      if (!formData.position.trim()) newErrors.position = 'Position is required when employed';
    }
    if (formData.expectedGraduationYear && (parseInt(formData.expectedGraduationYear) < new Date().getFullYear() || parseInt(formData.expectedGraduationYear) > new Date().getFullYear() + 10)) {
      newErrors.expectedGraduationYear = 'Expected graduation year must be between current year and next 10 years';
    }
    if (formData.isPursuingHigherEducation) {
      if (!formData.currentInstitution.trim()) newErrors.currentInstitution = 'Current institution is required when pursuing higher education';
      if (!formData.currentCourse.trim()) newErrors.currentCourse = 'Current course is required when pursuing higher education';
      if (!formData.institutionCountry.trim()) newErrors.institutionCountry = 'Institution country is required when pursuing higher education';
    }
    if (formData.isPreparingCompetitiveExams) {
      if (!formData.competitiveExamDetails.trim()) newErrors.competitiveExamDetails = 'Exam details are required when preparing for competitive exams';
    }
    if (formData.isSeekingOpportunities) {
      if (!formData.opportunityPreferences.trim()) newErrors.opportunityPreferences = 'Opportunity preferences are required when seeking opportunities';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }
    
    // Get effective branch and program values (custom or selected)
    const effectiveBranch = showCustomBranch ? formData.customBranch : formData.branch;
    const effectiveProgram = showCustomProgram ? formData.customProgram : formData.program;
    
    // Create updated data with effective values
    const updatedData = {
      ...formData,
      branch: effectiveBranch,
      program: effectiveProgram
    };
    
    onSave(updatedData);
  };

  const branches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology',
    'OTHER'
  ];
  
  const programs = ['B.Tech', 'M.Tech', 'MBA', 'MCA', 'B.Sc', 'M.Sc', 'PhD', 'Diploma', 'OTHER'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <AlumniInputField 
          icon={FaUser} 
          label="Full Name" 
          name="fullName"
          error={errors.fullName}
          formData={formData}
          handleChange={handleChange}
        />
        
        <AlumniInputField 
          icon={FaBirthdayCake} 
          label="Age" 
          name="age"
          type="number"
          error={errors.age}
          description="Optional field"
          formData={formData}
          handleChange={handleChange}
        />
        
        <AlumniInputField 
          icon={FaCog} 
          label="Branch" 
          name="branch"
          error={errors.branch}
          formData={formData}
          handleChange={handleChange}
        >
          <select
            name="branch"
            value={showCustomBranch ? 'OTHER' : formData.branch}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.branch ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          >
            <option value="">Select branch</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>
                {branch === 'OTHER' ? 'OTHER (Enter custom branch)' : branch}
              </option>
            ))}
          </select>
          
          {showCustomBranch && (
            <div className="mt-3">
              <input
                type="text"
                name="customBranch"
                required
                value={formData.customBranch}
                onChange={handleChange}
                className="w-full px-4 py-3 sm:py-4 border border-indigo-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                placeholder="Enter your branch/department name"
              />
            </div>
          )}
          
          {/* Help message */}
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold flex items-center">
                <FaLightbulb className="mr-1 text-yellow-500" />
                Tip:
              </span> If your branch/department is not in the list, choose "OTHER" and enter your specific branch name.
            </p>
          </div>
        </AlumniInputField>
        
        <AlumniInputField 
          icon={FaGraduationCap} 
          label="Program" 
          name="program"
          error={errors.program}
          formData={formData}
          handleChange={handleChange}
        >
          <select
            name="program"
            value={showCustomProgram ? 'OTHER' : formData.program}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.program ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          >
            <option value="">Select program</option>
            {programs.map(program => (
              <option key={program} value={program}>
                {program === 'OTHER' ? 'OTHER (Enter custom program)' : program}
              </option>
            ))}
          </select>
          
          {showCustomProgram && (
            <div className="mt-3">
              <input
                type="text"
                name="customProgram"
                required
                value={formData.customProgram}
                onChange={handleChange}
                className="w-full px-4 py-3 sm:py-4 border border-indigo-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-sm sm:text-base"
                placeholder="Enter your program name (e.g., BCA, MCA, B.Sc CS, etc.)"
              />
            </div>
          )}
          
          {/* Help message */}
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold flex items-center">
                <FaLightbulb className="mr-1 text-yellow-500" />
                Tip:
              </span> If your program is not in the list, choose "OTHER" and enter your specific program name.
            </p>
          </div>
        </AlumniInputField>
        
        <AlumniInputField 
          icon={FaUserGraduate} 
          label="Passing Year" 
          name="passingYear"
          type="number"
          error={errors.passingYear}
          formData={formData}
          handleChange={handleChange}
        />
        
        <AlumniInputField 
          icon={FaUniversity} 
          label="Previous Campus" 
          name="previousCampus"
          error={errors.previousCampus}
          description="Campus where you studied (before college merger)"
          formData={formData}
          handleChange={handleChange}
        >
          <select
            name="previousCampus"
            value={formData.previousCampus}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.previousCampus ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-indigo-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          >
            <option value="">Select campus (if applicable)</option>
            <option value="GB Pant Institute of Technology(GBPIT)(Polytechnic)">GB Pant Institute of Technology(GBPIT)(Polytechnic)</option>
            <option value="GB Pant Engineering College(GBPEC)">GB Pant Engineering College(GBPEC)</option>
            <option value="GB Pant DSEU Campus">GB Pant DSEU Campus</option>
            <option value="Other">Other</option>
          </select>
        </AlumniInputField>
        
        <AlumniInputField 
          icon={FaMapMarkerAlt} 
          label="Location" 
          name="location"
          error={errors.location}
          description="Current city or location"
          formData={formData}
          handleChange={handleChange}
        />
      </div>

      {/* Employment Status */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isEmployed"
              checked={formData.isEmployed}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FaBriefcase className="w-5 h-5 text-indigo-600" />
              <span className="text-base font-bold text-slate-900">Currently Employed</span>
            </div>
            <p className="text-sm text-slate-600">Check this if you are currently working at a company</p>
          </div>
        </label>
      </div>

      {/* Employment Details */}
      {formData.isEmployed && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-200">
          <div className="flex items-center gap-2 mb-6">
            <FaBuilding className="w-5 h-5 text-indigo-600" />
            <h4 className="text-lg font-bold text-slate-900">Employment Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AlumniInputField 
              icon={FaBuilding} 
              label="Current Employer" 
              name="employer"
              error={errors.employer}
              formData={formData}
              handleChange={handleChange}
            />
            
            <AlumniInputField 
              icon={FaAward} 
              label="Position/Role" 
              name="position"
              error={errors.position}
              formData={formData}
              handleChange={handleChange}
            />
          </div>
        </div>
      )}
      
      {/* Higher Education Status */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPursuingHigherEducation"
              checked={formData.isPursuingHigherEducation}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />
              <span className="text-base font-bold text-slate-900">Currently Pursuing Higher Education</span>
            </div>
            <p className="text-sm text-slate-600">Check this if you are currently enrolled in higher studies (Masters, PhD, etc.)</p>
          </div>
        </label>
      </div>

      {/* Higher Education Details */}
      {formData.isPursuingHigherEducation && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-indigo-200">
          <div className="flex items-center gap-2 mb-6">
            <HiOutlineAcademicCap className="w-5 h-5 text-indigo-600" />
            <h4 className="text-lg font-bold text-slate-900">Higher Education Details</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AlumniInputField 
              icon={FaBuilding} 
              label="Current Institution" 
              name="currentInstitution"
              error={errors.currentInstitution}
              description="Name of the university/college where you are studying"
              formData={formData}
              handleChange={handleChange}
            />
            
            <AlumniInputField 
              icon={FaGraduationCap} 
              label="Course/Program" 
              name="currentCourse"
              error={errors.currentCourse}
              description="e.g., M.Tech CS, MBA, PhD Computer Science"
              formData={formData}
              handleChange={handleChange}
            />
            
            <AlumniInputField 
              icon={FaMapMarkerAlt} 
              label="Institution Country" 
              name="institutionCountry"
              error={errors.institutionCountry}
              description="Country where the institution is located"
              formData={formData}
              handleChange={handleChange}
            />
            
            <AlumniInputField 
              icon={FaCalendarAlt} 
              label="Expected Graduation Year" 
              name="expectedGraduationYear"
              type="number"
              error={errors.expectedGraduationYear}
              description="When do you expect to complete your studies?"
              formData={formData}
              handleChange={handleChange}
            />
          </div>
        </div>
      )}
      
      {/* Competitive Exam Preparation Status */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isPreparingCompetitiveExams"
              checked={formData.isPreparingCompetitiveExams}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-2 focus:ring-orange-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FaLightbulb className="w-5 h-5 text-orange-600" />
              <span className="text-base font-bold text-slate-900">Preparing for Competitive Exams</span>
            </div>
            <p className="text-sm text-slate-600">Check this if you are currently preparing for competitive exams (GATE, CAT, UPSC, GRE, etc.)</p>
          </div>
        </label>
      </div>

      {/* Competitive Exam Details */}
      {formData.isPreparingCompetitiveExams && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 sm:p-8 border border-orange-200">
          <div className="flex items-center gap-2 mb-6">
            <FaLightbulb className="w-5 h-5 text-orange-600" />
            <h4 className="text-lg font-bold text-slate-900">Competitive Exam Details</h4>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaGraduationCap className="w-4 h-4 text-slate-500" />
              Exam Details *
            </label>
            <div className="space-y-1">
              <textarea
                name="competitiveExamDetails"
                rows="3"
                value={formData.competitiveExamDetails}
                onChange={handleChange}
                maxLength="400"
                className={`w-full px-4 py-3 sm:py-4 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white resize-none text-sm sm:text-base ${
                  formData.competitiveExamDetails?.length > 400 ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., Preparing for GATE 2026 (CSE), targeting IIT Delhi/Bombay for M.Tech. Also preparing for GRE for MS abroad. Expected exam dates: Feb 2026 (GATE), Dec 2025 (GRE)"
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mention exam names, target dates, institutions, etc.</span>
                <span className={`${
                  formData.competitiveExamDetails?.length > 400 ? 'text-red-500 font-semibold' : 
                  formData.competitiveExamDetails?.length > 350 ? 'text-orange-500' : 'text-slate-400'
                }`}>
                  {formData.competitiveExamDetails?.length || 0}/400
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seeking Opportunities Status */}
      <div className="bg-gradient-to-r from-slate-50 to-indigo-50 rounded-2xl p-6 border border-slate-200">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isSeekingOpportunities"
              checked={formData.isSeekingOpportunities}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-2 focus:ring-green-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <FaHandshake className="w-5 h-5 text-green-600" />
              <span className="text-base font-bold text-slate-900">Looking for Opportunities</span>
            </div>
            <p className="text-sm text-slate-600">Check this if you are currently seeking job opportunities, freelancing, or consulting work</p>
          </div>
        </label>
      </div>

      {/* Opportunity Preferences Details */}
      {formData.isSeekingOpportunities && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 sm:p-8 border border-green-200">
          <div className="flex items-center gap-2 mb-6">
            <FaHandshake className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-bold text-slate-900">Opportunity Preferences</h4>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FaBriefcase className="w-4 h-4 text-slate-500" />
              Opportunity Details *
            </label>
            <div className="space-y-1">
              <textarea
                name="opportunityPreferences"
                rows="3"
                value={formData.opportunityPreferences}
                onChange={handleChange}
                maxLength="400"
                className={`w-full px-4 py-3 sm:py-4 border rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all bg-white resize-none text-sm sm:text-base ${
                  formData.opportunityPreferences?.length > 400 ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., Looking for Software Engineer roles in Tech companies (Google, Microsoft, Amazon). Open to remote work. Interested in Full-stack, Backend development. Preferred locations: Bangalore, Hyderabad, Remote. Also open to freelancing projects in web development."
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Specify job types, locations, industries, freelancing preferences, etc.</span>
                <span className={`${
                  formData.opportunityPreferences?.length > 400 ? 'text-red-500 font-semibold' : 
                  formData.opportunityPreferences?.length > 350 ? 'text-orange-500' : 'text-slate-400'
                }`}>
                  {formData.opportunityPreferences?.length || 0}/400
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Social Links */}
      <AlumniInputField 
        icon={FaLinkedin} 
        label="LinkedIn Profile" 
        name="linkedInProfile"
        type="url"
        error={errors.linkedInProfile}
        description="Your full LinkedIn profile URL"
        formData={formData}
        handleChange={handleChange}
      />
      
      {/* Experience */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FaLightbulb className="w-4 h-4 text-slate-500" />
          Professional Experience, skills and about you
        </label>
        <div className="space-y-1">
          <textarea
            name="experience"
            rows="6"
            value={formData.experience}
            onChange={handleChange}
            maxLength="500"
            className={`w-full px-4 py-3 sm:py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white resize-none text-sm sm:text-base ${
              formData.experience?.length > 500 ? 'border-red-500' : 'border-slate-300'
            }`}
            placeholder="Share your professional journey, about yourself, key achievements, skills, and career highlights. This helps currently studying students learn from your experience..."
          />
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">This information will be visible to only current students.</span>
            <span className={`${
              formData.experience?.length > 500 ? 'text-red-500 font-semibold' : 
              formData.experience?.length > 450 ? 'text-orange-500' : 'text-slate-400'
            }`}>
              {formData.experience?.length || 0}/500
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-8 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 font-semibold text-sm sm:text-base"
        >
          <FaTimes className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg"
        >
          <FaSave className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
});
