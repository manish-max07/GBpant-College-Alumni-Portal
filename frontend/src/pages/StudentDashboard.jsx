import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import PhoneInput from '../components/PhoneInput';
import ProfilePicture from '../components/ProfilePicture';
import AdminPanel from '../components/AdminPanel';
import { 
  FaUser, 
  FaEdit, 
  FaGraduationCap, 
  FaChartLine, 
  FaIdCard,
  FaCalendarAlt,
  FaBook,
  FaAward,
  FaEnvelope,
  FaPhone,
  FaUsers,
  FaBriefcase,
  FaBookOpen,
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
  FaLinkedin,
  FaGithub,
  FaPlus,
  FaCode,
  FaLaptopCode,
  FaTags
} from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [skillsModalOpen, setSkillsModalOpen] = useState(false);
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [internshipsModalOpen, setInternshipsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingInternship, setEditingInternship] = useState(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const navigate = useNavigate();

  // Helper function to ensure proper URL format
  const formatUrl = (url) => {
    if (!url || url.trim() === '') return '';
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  useEffect(() => {
    fetchProfile();
    // Clear any old localStorage flag that permanently dismissed the modal
    localStorage.removeItem('welcomeModalDismissed');
  }, []);

  // Check if welcome modal should be shown
  useEffect(() => {
    if (profile?.profile && !loading) {
      const hasLinkedIn = profile.profile.linkedinProfile;
      const hasGithub = profile.profile.githubProfile;
      
      // Show modal if user doesn't have both LinkedIn and GitHub profiles
      if (!hasLinkedIn || !hasGithub) {
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

      const response = await api.get('/api/profile/student', {
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
          rollNo: profile.roll_no,
          currentYear: profile.current_year,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          linkedinProfile: profile.linkedin_profile,
          githubProfile: profile.github_profile,
          skills: profile.skills || [],
          projects: Array.isArray(profile.projects) ? profile.projects : [],
          internships: Array.isArray(profile.internships) ? profile.internships : []
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
      
      // Process skills if they're still in string format
      const processedSkills = Array.isArray(updatedData.skills) 
        ? updatedData.skills 
        : (typeof updatedData.skills === 'string' && updatedData.skills.trim() 
            ? updatedData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
            : []
          );
      
      // Transform camelCase to snake_case for API
      const apiData = {
        full_name: updatedData.fullName,
        branch: updatedData.branch,
        program: updatedData.program,
        current_year: updatedData.currentYear,
        semester: updatedData.semester,
        cgpa: updatedData.cgpa,
        linkedin_profile: updatedData.linkedinProfile,
        github_profile: updatedData.githubProfile,
        skills: processedSkills,
        projects: updatedData.projects,
        internships: updatedData.internships
      };
      
      const response = await api.put('/api/profile/student', apiData, {
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
          currentYear: updatedData.currentYear,
          linkedinProfile: updatedData.linkedinProfile,
          githubProfile: updatedData.githubProfile,
        };
        
        setProfile(prevProfile => ({ 
          ...prevProfile, 
          profile: { ...prevProfile?.profile, ...updatedProfile } 
        }));
        setEditing(false);
        
        // Check if both LinkedIn and GitHub are now filled and close welcome modal
        if (updatedData.linkedinProfile && updatedData.githubProfile) {
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

  const handleViewAlumni = useCallback(() => {
    setShowWelcomeModal(false);
    navigate('/alumni-list');
  }, [navigate]);

  if (loading) {
    return (
      <>
        <Layout showNav={false}>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-3xl flex items-center justify-center mb-6 mx-auto animate-pulse shadow-lg border border-gray-100">
                <img 
                  src="/logo1.png" 
                  alt="GB Pant Alumni Portal" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
              </div>
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
              <p className="text-slate-700 font-semibold text-lg sm:text-xl">Loading your dashboard...</p>
              <p className="text-slate-500 text-sm sm:text-base mt-2">Preparing your academic overview</p>
            </div>
          </div>
        </Layout>
        <AdminPanel />
      </>
    );
  }
  return (
    <>
      <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
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
                  <div className="absolute -bottom-2 -left-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white z-10">
                    <FaCheck className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                    Welcome back, {profile?.profile?.fullName?.split(' ')[0] || 'Student'}! 
                    <span className="ml-2">👋</span>
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-blue-100 text-sm sm:text-base mb-4">
                    <div className="flex items-center gap-1.5">
                      <HiOutlineAcademicCap className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>GB Pant College Student</span>
                    </div>
                    <span className="hidden sm:inline text-blue-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <FaBook className="w-4 h-4" />
                      <span>{profile?.profile?.program}</span>
                    </div>
                    <span className="hidden sm:inline text-blue-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <FaCalendarAlt className="w-4 h-4" />
                      <span>Year {profile?.profile?.currentYear}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                      <FaChartLine className="w-4 h-4 mr-2" />
                      <span className="text-sm sm:text-base font-semibold">
                        CGPA: {profile?.profile?.cgpa || '0.00'}/10.0
                      </span>
                    </div>
                    <div className="flex items-center text-blue-200 text-sm sm:text-base">
                      <FaIdCard className="w-4 h-4 mr-2" />
                      <span>{profile?.profile?.rollNo}</span>
                    </div>
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
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                        <FaUser className="w-4 h-4 text-blue-600" />
                      </div>
                      Profile Information
                    </h2>
                    {!editing && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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

              {/* Academic Performance */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                    <FaChartLine className="w-4 h-4 text-green-600" />
                  </div>
                  Academic Performance
                </h3>
                
                <div className="space-y-6">
                  {/* CGPA Card */}
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 sm:p-8 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">Current CGPA</h4>
                        <div className="text-3xl sm:text-4xl font-bold text-blue-600">
                          {profile?.profile?.cgpa || '0.00'}
                          <span className="text-xl sm:text-2xl text-slate-500">/10.0</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-2xl">
                        <FaTrophy className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="w-full bg-blue-200 rounded-full h-4 sm:h-5 mb-4">
                      <div
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 sm:h-5 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${((profile?.profile?.cgpa || 0) / 10) * 100}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm sm:text-base">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-semibold text-blue-600">
                        {((profile?.profile?.cgpa || 0) / 10 * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="mt-4 p-4 bg-white/50 rounded-xl">
                      <p className="text-sm sm:text-base text-slate-700 flex items-center">
                        {profile?.profile?.cgpa >= 9.0 ? (
                          <>
                            <FaStar className="w-5 h-5 text-yellow-500 mr-2" />
                            Outstanding! You're in the top tier!
                          </>
                        ) : profile?.profile?.cgpa >= 8.5 ? (
                          <>
                            <FaTrophy className="w-5 h-5 text-blue-500 mr-2" />
                            Excellent performance! Keep it up!
                          </>
                        ) : profile?.profile?.cgpa >= 7.0 ? (
                          <>
                            <FaCog className="w-5 h-5 text-green-500 mr-2" />
                            Good work! Aim higher for excellence!
                          </>
                        ) : profile?.profile?.cgpa >= 6.0 ? (
                          <>
                            <FaLightbulb className="w-5 h-5 text-orange-500 mr-2" />
                            Keep improving! You can do better!
                          </>
                        ) : (
                          <>
                            <FaRocket className="w-5 h-5 text-red-500 mr-2" />
                            Time to boost your performance!
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6 sm:space-y-8">
              {/* Academic Stats */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                    <FaGraduationCap className="w-4 h-4 text-purple-600" />
                  </div>
                  Academic Details
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaIdCard className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Roll Number</span>
                    </div>
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {profile?.profile?.rollNo || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaCalendarAlt className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Current Year</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profile?.profile?.currentYear ? `Year ${profile.profile.currentYear}` : '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaBook className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Semester</span>
                    </div>
                    <span className="font-bold text-slate-900">
                      {profile?.profile?.semester || '-'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaAward className="w-5 h-5 text-slate-500" />
                      <span className="text-slate-600 font-medium">Program</span>
                    </div>
                    <span className="font-bold text-slate-900 text-right text-sm sm:text-base">
                      {profile?.profile?.program || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                    <FaUsers className="w-4 h-4 text-blue-600" />
                  </div>
                  Social Media Links
                </h3>
                
                <div className="space-y-4">
                  {/* LinkedIn */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaLinkedin className="w-5 h-5 text-blue-600" />
                      <span className="text-slate-600 font-medium">LinkedIn</span>
                    </div>
                    {profile?.profile?.linkedinProfile ? (
                      <a
                        href={profile.profile.linkedinProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm truncate max-w-[200px] transition-colors"
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">Not provided</span>
                    )}
                  </div>
                  
                  {/* GitHub */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <FaGithub className="w-5 h-5 text-gray-800" />
                      <span className="text-slate-600 font-medium">GitHub</span>
                    </div>
                    {profile?.profile?.githubProfile ? (
                      <a
                        href={profile.profile.githubProfile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-800 hover:text-gray-900 font-medium text-sm truncate max-w-[200px] transition-colors"
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm">Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
                      <FaTags className="w-4 h-4 text-green-600" />
                    </div>
                    Skills
                  </h3>
                  <button 
                    onClick={() => setSkillsModalOpen(true)}
                    className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors group"
                    title="Add or edit skills"
                  >
                    <FaPlus className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  {profile?.profile?.skills && profile.profile.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.profile.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-xl text-sm font-medium border border-green-200 hover:shadow-md transition-all hover:scale-105"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FaTags className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No skills added yet</p>
                      <button 
                        onClick={() => setSkillsModalOpen(true)}
                        className="mt-3 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaPlus className="w-3 h-3" />
                        Add your first skill
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Projects Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                    <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
                      <FaCode className="w-4 h-4 text-purple-600" />
                    </div>
                    Projects
                  </h3>
                  <button 
                    onClick={() => setProjectsModalOpen(true)}
                    className="w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors group"
                    title="Add a new project"
                  >
                    <FaPlus className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {profile?.profile?.projects && profile.profile.projects.length > 0 ? (
                    profile.profile.projects.map((project, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaLaptopCode className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-slate-900 break-words flex-1 mr-2">{project.name || `Project ${index + 1}`}</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingProject(index)}
                                  className="w-8 h-8 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-all"
                                  title="Edit this project"
                                >
                                  <FaEdit className="w-3 h-3 text-purple-600" />
                                </button>
                                {project.deployed_link && (
                                  <a 
                                    href={formatUrl(project.deployed_link)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-purple-600 hover:text-purple-800 transition-colors"
                                    title="View Live Project"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                            {project.description && (
                              <p className="text-slate-600 text-sm leading-relaxed break-words">
                                {project.description}
                              </p>
                            )}
                            {project.deployed_link && (
                              <p className="text-xs text-purple-600 mt-1">
                                🔗 {project.deployed_link}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FaCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No projects added yet</p>
                      <button 
                        onClick={() => setProjectsModalOpen(true)}
                        className="mt-3 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaPlus className="w-3 h-3" />
                        Add your first project
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Internships Section */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                      <FaBriefcase className="w-4 h-4 text-orange-600" />
                    </div>
                    Internships
                  </h3>
                  <button 
                    onClick={() => setInternshipsModalOpen(true)}
                    className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition-colors group"
                    title="Add a new internship"
                  >
                    <FaPlus className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {profile?.profile?.internships && profile.profile.internships.length > 0 ? (
                    profile.profile.internships.map((internship, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <FaBriefcase className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-slate-900 break-words flex-1">{internship.company_name || `Company ${index + 1}`}</h4>
                              <button
                                onClick={() => setEditingInternship(index)}
                                className="w-8 h-8 bg-orange-100 hover:bg-orange-200 rounded-full flex items-center justify-center transition-all"
                                title="Edit this internship"
                              >
                                <FaEdit className="w-3 h-3 text-orange-600" />
                              </button>
                            </div>
                            {internship.position && (
                              <p className="text-orange-600 text-sm font-medium mb-2 break-words">{internship.position}</p>
                            )}
                            {internship.description && (
                              <p className="text-slate-600 text-sm leading-relaxed break-words">
                                {internship.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FaBriefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No internships added yet</p>
                      <button 
                        onClick={() => setInternshipsModalOpen(true)}
                        className="mt-3 px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
                      >
                        <FaPlus className="w-3 h-3" />
                        Add your first internship
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 flex items-center">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center mr-3">
                    <FaRocket className="w-4 h-4 text-indigo-600" />
                  </div>
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FaChartLine className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-900">View Grades</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button 
                    onClick={() => navigate('/alumni-list')}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <FaUsers className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Connect with Alumni</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <FaBriefcase className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Career Resources</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl transition-all duration-200 text-left group border border-slate-200 hover:border-blue-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                        <FaBookOpen className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-semibold text-slate-900">Study Resources</span>
                    </div>
                    <FaChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </div>

              {/* Student Spotlight */}
              <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>
                
                <div className="relative z-10">
                  <h3 className="text-lg sm:text-xl font-bold mb-4 flex items-center">
                    <FaGem className="w-6 h-6 mr-3" />
                    Student Spotlight
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base mb-6 leading-relaxed">
                    Showcase your projects, achievements, and skills to get noticed by alumni and recruiters.
                  </p>
                  <button className="w-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 font-semibold border border-white/30 hover:border-white/50">
                    <FaGem className="w-5 h-5" />
                    <span>Create Portfolio</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Edit Modals */}
      {skillsModalOpen && (
        <QuickEditModal
          title="Edit Skills"
          icon={FaTags}
          color="green"
          value={Array.isArray(profile?.profile?.skills) ? profile.profile.skills.join(', ') : ''}
          placeholder="JavaScript, React, Python, Java, etc."
          onSave={(value) => {
            const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
            const updatedProfile = {
              ...profile.profile,
              skills: skillsArray
            };
            handleSave(updatedProfile);
            setSkillsModalOpen(false);
          }}
          onClose={() => setSkillsModalOpen(false)}
        />
      )}

      {projectsModalOpen && (
        <AddProjectModal
          onSave={(project) => {
            const updatedProjects = [...(profile?.profile?.projects || []), project];
            const updatedProfile = {
              ...profile.profile,
              projects: updatedProjects
            };
            handleSave(updatedProfile);
            setProjectsModalOpen(false);
          }}
          onClose={() => setProjectsModalOpen(false)}
        />
      )}

      {editingProject !== null && (
        <EditProjectModal
          project={profile?.profile?.projects[editingProject]}
          onSave={(updatedProject) => {
            const updatedProjects = [...(profile?.profile?.projects || [])];
            updatedProjects[editingProject] = updatedProject;
            const updatedProfile = {
              ...profile.profile,
              projects: updatedProjects
            };
            handleSave(updatedProfile);
            setEditingProject(null);
          }}
          onDelete={() => {
            const updatedProjects = [...(profile?.profile?.projects || [])];
            updatedProjects.splice(editingProject, 1);
            const updatedProfile = {
              ...profile.profile,
              projects: updatedProjects
            };
            handleSave(updatedProfile);
            setEditingProject(null);
          }}
          onClose={() => setEditingProject(null)}
        />
      )}

      {internshipsModalOpen && (
        <AddInternshipModal
          onSave={(internship) => {
            const updatedInternships = [...(profile?.profile?.internships || []), internship];
            const updatedProfile = {
              ...profile.profile,
              internships: updatedInternships
            };
            handleSave(updatedProfile);
            setInternshipsModalOpen(false);
          }}
          onClose={() => setInternshipsModalOpen(false)}
        />
      )}

      {editingInternship !== null && (
        <EditInternshipModal
          internship={profile?.profile?.internships[editingInternship]}
          onSave={(updatedInternship) => {
            const updatedInternships = [...(profile?.profile?.internships || [])];
            updatedInternships[editingInternship] = updatedInternship;
            const updatedProfile = {
              ...profile.profile,
              internships: updatedInternships
            };
            handleSave(updatedProfile);
            setEditingInternship(null);
          }}
          onDelete={() => {
            const updatedInternships = [...(profile?.profile?.internships || [])];
            updatedInternships.splice(editingInternship, 1);
            const updatedProfile = {
              ...profile.profile,
              internships: updatedInternships
            };
            handleSave(updatedProfile);
            setEditingInternship(null);
          }}
          onClose={() => setEditingInternship(null)}
        />
      )}

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white relative">
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
                  <h3 className="text-xl font-bold">Welcome to GB Pant College Alumni Portal!</h3>
                  <p className="text-blue-100 text-sm">Complete your profile</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-3">
                  {!profile?.profile?.linkedinProfile && !profile?.profile?.githubProfile 
                    ? "Add your professional profiles" 
                    : !profile?.profile?.linkedinProfile 
                      ? "Add your LinkedIn profile" 
                      : "Add your GitHub profile"}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  {!profile?.profile?.linkedinProfile && !profile?.profile?.githubProfile 
                    ? "Please add your LinkedIn and GitHub profile links to connect with alumni and showcase your professional presence."
                    : !profile?.profile?.linkedinProfile 
                      ? "Please add your LinkedIn profile to connect with alumni and build your professional network."
                      : "Please add your GitHub profile to showcase your coding projects and technical skills."}
                </p>
                
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <FaLinkedin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Professional Networking</p>
                      <p className="text-slate-600 text-xs">Connect with alumni working at top companies</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaGithub className="w-5 h-5 text-gray-700 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Showcase Projects</p>
                      <p className="text-slate-600 text-xs">Display your coding skills and projects</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleViewAlumni}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2"
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
                This notification will appear until you add both LinkedIn and GitHub profiles
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
    <AdminPanel />
    </>
  );
}

function ProfileView({ profile }) {
  const profileFields = [
    { label: 'Full Name', key: 'fullName', icon: FaUser, color: 'blue' },
    { label: 'Roll Number', key: 'rollNo', icon: FaIdCard, color: 'indigo' },
    { label: 'Branch', key: 'branch', icon: FaCog, color: 'green' },
    { label: 'Program', key: 'program', icon: FaGraduationCap, color: 'purple' },
    { label: 'Current Year', key: 'currentYear', icon: FaCalendarAlt, color: 'orange', render: (value) => value ? `Year ${value}` : '-' },
    { label: 'Semester', key: 'semester', icon: FaBook, color: 'pink' },
    { label: 'CGPA', key: 'cgpa', icon: FaChartLine, color: 'teal', render: (value) => value ? `${value}/10.0` : '-' },
    { label: 'Email', key: 'email', icon: FaEnvelope, color: 'red' },
    { label: 'Mobile', key: 'mobile', icon: FaPhone, color: 'yellow' },
    { label: 'LinkedIn', key: 'linkedinProfile', icon: FaLinkedin, color: 'blue', render: (value) => value ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">
        View Profile
      </a>
    ) : '-' },
    { label: 'GitHub', key: 'githubProfile', icon: FaGithub, color: 'gray', render: (value) => value ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 underline">
        View Profile
      </a>
    ) : '-' }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    teal: 'bg-teal-100 text-teal-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  const renderField = (field) => {
    const value = profile?.[field.key];
    const displayValue = field.render ? field.render(value) : (value || '-');
    const IconComponent = field.icon;
    
    return (
      <div key={field.key} className="group bg-gradient-to-r from-slate-50 to-blue-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl p-5 border border-slate-200 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 ${colorClasses[field.color]} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-semibold text-slate-600 mb-2">
              {field.label}
            </label>
            <div className="text-slate-900 font-bold text-lg leading-tight break-words">
              {displayValue}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
            <FaUser className="w-4 h-4 text-blue-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Personal Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {profileFields.slice(0, 3).map(renderField)}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center mr-3">
            <FaGraduationCap className="w-4 h-4 text-purple-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Academic Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
          {profileFields.slice(3, 7).map(renderField)}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center mr-3">
            <FaEnvelope className="w-4 h-4 text-green-600" />
          </div>
          <h4 className="text-lg font-bold text-slate-900">Contact Information</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {profileFields.slice(7).map(renderField)}
        </div>
      </div>
    </div>
  );
}

// InputField component moved outside to prevent re-creation on every render
const StudentInputField = ({ icon: Icon, label, name, type = "text", children, error, formData, handleChange }) => (
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
          className={`w-full px-4 py-3 sm:py-4 border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
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
  </div>
);

const EditProfileForm = React.memo(({ profile, onSave, onCancel }) => {
  const [showCustomBranch, setShowCustomBranch] = useState(false);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    branch: profile?.branch || '',
    program: profile?.program || '',
    customBranch: '', // For custom branch entry
    customProgram: '', // For custom program entry
    currentYear: profile?.currentYear || '',
    semester: profile?.semester || '',
    cgpa: profile?.cgpa || '',
    linkedinProfile: profile?.linkedinProfile || '',
    githubProfile: profile?.githubProfile || '',
    skills: profile?.skills || [],
    projects: profile?.projects || '',
    internships: profile?.internships || ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = useCallback((e) => {
    const value = e.target.value;
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
    
    // Check effective branch (custom or selected)
    const effectiveBranch = showCustomBranch ? formData.customBranch : formData.branch;
    if (!effectiveBranch || !effectiveBranch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    
    // Check effective program (custom or selected)  
    const effectiveProgram = showCustomProgram ? formData.customProgram : formData.program;
    if (!effectiveProgram || !effectiveProgram.trim()) {
      newErrors.program = 'Program is required';
    }
    
    if (!formData.currentYear) newErrors.currentYear = 'Current year is required';
    if (!formData.semester) newErrors.semester = 'Semester is required';
    if (formData.cgpa && (parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 10)) {
      newErrors.cgpa = 'CGPA must be between 0 and 10';
    }
    
    // URL validation
    const urlPattern = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    
    if (formData.linkedinProfile && !urlPattern.test(formData.linkedinProfile)) {
      newErrors.linkedinProfile = 'Please enter a valid LinkedIn URL';
    }
    
    if (formData.githubProfile && !urlPattern.test(formData.githubProfile)) {
      newErrors.githubProfile = 'Please enter a valid GitHub URL';
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
        <StudentInputField 
          icon={FaUser} 
          label="Full Name" 
          name="fullName"
          error={errors.fullName}
          formData={formData}
          handleChange={handleChange}
        />
        
        <StudentInputField 
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
            className={`w-full px-4 py-3 sm:py-4 border ${errors.branch ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
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
                className="w-full px-4 py-3 sm:py-4 border border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm sm:text-base"
                placeholder="Enter your branch/department name"
              />
            </div>
          )}
          
          {/* Help message */}
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> If your branch/department is not in the list, choose "OTHER" and enter your specific branch name.
            </p>
          </div>
        </StudentInputField>
        
        <StudentInputField 
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
            className={`w-full px-4 py-3 sm:py-4 border ${errors.program ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
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
                className="w-full px-4 py-3 sm:py-4 border border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-sm sm:text-base"
                placeholder="Enter your program name"
              />
            </div>
          )}
          
          {/* Help message */}
          <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">💡 Tip:</span> If your program (B.Tech, M.Tech, etc.) is not in the list, choose "OTHER" and enter your specific program name.
            </p>
          </div>
        </StudentInputField>
        
        <StudentInputField 
          icon={FaCalendarAlt} 
          label="Current Year" 
          name="currentYear"
          error={errors.currentYear}
          formData={formData}
          handleChange={handleChange}
        >
          <select
            name="currentYear"
            value={formData.currentYear}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.currentYear ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          >
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>
        </StudentInputField>
        
        <StudentInputField 
          icon={FaBook} 
          label="Semester" 
          name="semester"
          error={errors.semester}
          formData={formData}
          handleChange={handleChange}
        >
          <select
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.semester ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
          >
            <option value="">Select semester</option>
            {[1,2,3,4,5,6,7,8,9,10].map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </StudentInputField>
        
        <StudentInputField 
          icon={FaChartLine} 
          label="CGPA" 
          name="cgpa"
          type="number"
          error={errors.cgpa}
          formData={formData}
          handleChange={handleChange}
        >
          <input
            type="number"
            name="cgpa"
            min="0"
            max="10"
            step="0.01"
            value={formData.cgpa}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.cgpa ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
            placeholder="e.g., 8.5"
          />
        </StudentInputField>
        
        {/* Social Media Links */}
        <StudentInputField 
          icon={FaLinkedin} 
          label="LinkedIn Profile" 
          name="linkedinProfile"
          type="url"
          error={errors.linkedinProfile}
          formData={formData}
          handleChange={handleChange}
        >
          <input
            type="url"
            name="linkedinProfile"
            value={formData.linkedinProfile}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.linkedinProfile ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </StudentInputField>
        
        <StudentInputField 
          icon={FaGithub} 
          label="GitHub Profile" 
          name="githubProfile"
          type="url"
          error={errors.githubProfile}
          formData={formData}
          handleChange={handleChange}
        >
          <input
            type="url"
            name="githubProfile"
            value={formData.githubProfile}
            onChange={handleChange}
            className={`w-full px-4 py-3 sm:py-4 border ${errors.githubProfile ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base`}
            placeholder="https://github.com/yourusername"
          />
        </StudentInputField>
      </div>

      {/* Skills Section */}
      <div className="space-y-6 pt-6 border-t border-slate-200">
        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FaTags className="w-5 h-5 text-slate-600" />
          Skills
        </h4>
        
        {/* Skills */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FaTags className="w-4 h-4 text-slate-500" />
            Skills (comma-separated)
          </label>
          <input
            type="text"
            value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
            onChange={(e) => {
              // Store the raw input value, don't process it until blur or submit
              setFormData({...formData, skills: e.target.value});
            }}
            onBlur={(e) => {
              // Process skills when user leaves the field
              if (typeof e.target.value === 'string') {
                const skillsArray = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
                setFormData({...formData, skills: skillsArray});
              }
            }}
            className="w-full px-4 py-3 sm:py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white text-sm sm:text-base"
            placeholder="JavaScript, React, Node.js, Python, etc."
          />
        </div>
      </div>
      
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
          className="flex items-center justify-center gap-2 px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-semibold text-sm sm:text-base shadow-lg"
        >
          <FaSave className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
});

function QuickEditModal({ title, icon: Icon, color, value, placeholder, multiline = false, onSave, onClose }) {
  const [inputValue, setInputValue] = useState(value);

  const colorClasses = {
    green: 'bg-green-100 text-green-600 border-green-200',
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200'
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(inputValue);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            {multiline ? (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                rows="6"
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              />
            ) : (
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddProjectModal({ onSave, onClose }) {
  const [project, setProject] = useState({ name: '', description: '', deployed_link: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (project.name.trim() || project.description.trim()) {
      onSave(project);
    }
  };

  const updateField = (field, value) => {
    setProject(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                <FaPlus className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Add New Project</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Project Name *</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={project.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <div className="space-y-1">
                <textarea
                  placeholder="Describe your project (max 300 characters)"
                  value={project.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows="4"
                  maxLength="300"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all ${
                    project.description?.length > 300 ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Keep it concise and informative</span>
                  <span className={`${
                    project.description?.length > 300 ? 'text-red-500 font-semibold' : 
                    project.description?.length > 250 ? 'text-orange-500' : 'text-slate-400'
                  }`}>
                    {project.description?.length || 0}/300
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Live Demo URL</label>
              <input
                type="url"
                placeholder="https://your-project-demo.com (optional)"
                value={project.deployed_link}
                onChange={(e) => updateField('deployed_link', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditProjectModal({ project, onSave, onDelete, onClose }) {
  const [editedProject, setEditedProject] = useState(project || { name: '', description: '', deployed_link: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editedProject.name.trim() || editedProject.description.trim()) {
      onSave(editedProject);
    }
  };

  const updateField = (field, value) => {
    setEditedProject(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                <FaEdit className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Edit Project</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Project Name *</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={editedProject.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <div className="space-y-1">
                <textarea
                  placeholder="Describe your project (max 300 characters)"
                  value={editedProject.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows="4"
                  maxLength="300"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition-all ${
                    editedProject.description?.length > 300 ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Keep it concise and informative</span>
                  <span className={`${
                    editedProject.description?.length > 300 ? 'text-red-500 font-semibold' : 
                    editedProject.description?.length > 250 ? 'text-orange-500' : 'text-slate-400'
                  }`}>
                    {editedProject.description?.length || 0}/300
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Live Demo URL</label>
              <input
                type="url"
                placeholder="https://your-project-demo.com (optional)"
                value={editedProject.deployed_link}
                onChange={(e) => updateField('deployed_link', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-3 border-2 border-red-300 text-red-700 rounded-2xl hover:bg-red-50 transition-colors font-semibold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddInternshipModal({ onSave, onClose }) {
  const [internship, setInternship] = useState({ company_name: '', position: '', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (internship.company_name.trim() || internship.position.trim() || internship.description.trim()) {
      onSave(internship);
    }
  };

  const updateField = (field, value) => {
    setInternship(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                <FaPlus className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Add New Internship</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
              <input
                type="text"
                placeholder="Enter company name"
                value={internship.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Position</label>
              <input
                type="text"
                placeholder="e.g., Software Developer Intern"
                value={internship.position}
                onChange={(e) => updateField('position', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <div className="space-y-1">
                <textarea
                  placeholder="Describe your role and achievements (max 300 characters)"
                  value={internship.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows="4"
                  maxLength="300"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all ${
                    internship.description?.length > 300 ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Highlight your key responsibilities</span>
                  <span className={`${
                    internship.description?.length > 300 ? 'text-red-500 font-semibold' : 
                    internship.description?.length > 250 ? 'text-orange-500' : 'text-slate-400'
                  }`}>
                    {internship.description?.length || 0}/300
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-lg"
            >
              Add Internship
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInternshipModal({ internship, onSave, onDelete, onClose }) {
  const [editedInternship, setEditedInternship] = useState(internship || { company_name: '', position: '', description: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editedInternship.company_name.trim() || editedInternship.position.trim() || editedInternship.description.trim()) {
      onSave(editedInternship);
    }
  };

  const updateField = (field, value) => {
    setEditedInternship(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center">
                <FaEdit className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Edit Internship</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <FaTimes className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
              <input
                type="text"
                placeholder="Enter company name"
                value={editedInternship.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Position</label>
              <input
                type="text"
                placeholder="e.g., Software Developer Intern"
                value={editedInternship.position}
                onChange={(e) => updateField('position', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <div className="space-y-1">
                <textarea
                  placeholder="Describe your role and achievements (max 300 characters)"
                  value={editedInternship.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows="4"
                  maxLength="300"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none transition-all ${
                    editedInternship.description?.length > 300 ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Highlight your key responsibilities</span>
                  <span className={`${
                    editedInternship.description?.length > 300 ? 'text-red-500 font-semibold' : 
                    editedInternship.description?.length > 250 ? 'text-orange-500' : 'text-slate-400'
                  }`}>
                    {editedInternship.description?.length || 0}/300
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-3 border-2 border-red-300 text-red-700 rounded-2xl hover:bg-red-50 transition-colors font-semibold"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-2xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-2xl hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-lg"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

