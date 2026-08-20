import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Captcha from '../components/Captcha';
import Layout from '../components/Layout';
import useAuth from '../hooks/useAuth';
import api from '../utils/api';

export default function FirstTimeForm() {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState(''); // 'alumni' or 'student'
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCustomBranch, setShowCustomBranch] = useState(false);
  const [showCustomProgram, setShowCustomProgram] = useState(false);
  const [formData, setFormData] = useState({
    // Common fields (removed fullName - already have from user)
    age: '',
    branch: '',
    program: '',
    customBranch: '', // For custom branch entry
    customProgram: '', // For custom program entry
    previousCampus: '', // New field for campus selection
    
    // Alumni fields
    passingYear: '',
    isEmployed: false,
    employer: '',
    position: '',
    experience: '',
    linkedInProfile: '',
    location: '',
    // Higher education fields
    isPursuingHigherEducation: false,
    currentInstitution: '',
    currentCourse: '',
    institutionCountry: '',
    expectedGraduationYear: '',
    // Additional status fields
    isPreparingCompetitiveExams: false,
    competitiveExamDetails: '',
    isSeekingOpportunities: false,
    opportunityPreferences: '',
    
    // Student fields (removed rollNo - already have from user)
    currentYear: '',
    semester: '',
    cgpa: '',
    linkedinProfile: '', // LinkedIn profile for students
    githubProfile: '', // GitHub profile for students
    skills: [], // Skills array for students
    projects: [], // Projects array for students - [{name, description, deployed_link}]
    internships: [] // Internships array for students - [{company_name, position, description}]
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { checkAuthStatus, user, getDashboardPath } = useAuth();

  const currentYear = new Date().getFullYear();
  const branches = [
    'Computer Science & Engineering',
    'Information Technology',
    'Electronics & Communication Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Chemical Engineering',
    'Biotechnology'
  ];

  const programs = ['B.Tech', 'M.Tech', 'PhD','Diploma'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Set userType from user context and skip Step 1
    if (user && user.user_type) {
      setUserType(user.user_type);
      setStep(2); // Skip Step 1 (user type selection) and go directly to basic info
    }
  }, [navigate, user]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const name = e.target.name;
    
    // Handle "OTHER" selection for branch
    if (name === 'branch') {
      if (value === 'OTHER') {
        setShowCustomBranch(true);
        setFormData({
          ...formData,
          [name]: '',
          customBranch: ''
        });
      } else {
        setShowCustomBranch(false);
        setFormData({
          ...formData,
          [name]: value,
          customBranch: ''
        });
      }
      return;
    }
    
    // Handle "OTHER" selection for program
    if (name === 'program') {
      if (value === 'OTHER') {
        setShowCustomProgram(true);
        setFormData({
          ...formData,
          [name]: '',
          customProgram: ''
        });
      } else {
        setShowCustomProgram(false);
        setFormData({
          ...formData,
          [name]: value,
          customProgram: ''
        });
      }
      return;
    }
    
    // Default handling for other fields
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    // Since we skip step 1 (user type selection), just proceed to next step
    setStep(step + 1);
  };

  const handleCaptchaVerify = (isVerified) => {
    setCaptchaVerified(isVerified);
  };

  const handleSubmit = async () => {
    if (!captchaVerified) {
      toast.error('Please verify the CAPTCHA before submitting');
      return;
    }

    // Validate required fields based on user type and selections
    if (userType === 'alumni') {
      // Get effective branch and program values (custom or selected)
      const effectiveBranch = showCustomBranch ? formData.customBranch : formData.branch;
      const effectiveProgram = showCustomProgram ? formData.customProgram : formData.program;
      
      // Basic alumni fields (removed fullName validation - already have from user)
      if (!formData.age || !effectiveBranch || !effectiveProgram || !formData.passingYear || !formData.previousCampus) {
        toast.error('Please fill in all required basic information including your campus');
        return;
      }

      // Validate custom fields if OTHER was selected
      if (showCustomBranch && !formData.customBranch.trim()) {
        toast.error('Please enter your custom branch/department name');
        return;
      }
      
      if (showCustomProgram && !formData.customProgram.trim()) {
        toast.error('Please enter your custom program name');
        return;
      }

      // Employment validation
      if (formData.isEmployed && (!formData.employer || !formData.position)) {
        toast.error('Please fill in employer and position details since you marked yourself as employed');
        return;
      }

      // Higher education validation
      if (formData.isPursuingHigherEducation && (!formData.currentInstitution || !formData.currentCourse || !formData.institutionCountry || !formData.expectedGraduationYear)) {
        toast.error('Please fill in all higher education details since you marked yourself as pursuing higher education');
        return;
      }

      // Note: Competitive exam details and opportunity preferences are optional during first-time form filling
      // Users can add these details later from their dashboard

      // At least one status should be selected
      if (!formData.isEmployed && !formData.isPursuingHigherEducation && !formData.isPreparingCompetitiveExams && !formData.isSeekingOpportunities) {
        toast.error('Please select your current status - employed, pursuing higher education, preparing for competitive exams, or seeking opportunities');
        return;
      }

      // LinkedIn profile is mandatory for alumni
      if (!formData.linkedInProfile || !formData.linkedInProfile.includes('linkedin.com')) {
        toast.error('A valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname) is required');
        return;
      }
    } else if (userType === 'student') {
      // Get effective branch and program values (custom or selected)
      const effectiveBranch = showCustomBranch ? formData.customBranch : formData.branch;
      const effectiveProgram = showCustomProgram ? formData.customProgram : formData.program;
      
      // Student validation (removed rollNo validation - already have from user)
      if (!formData.currentYear || !formData.semester || !effectiveBranch || !effectiveProgram) {
        toast.error('Please fill in all required student information');
        return;
      }
      
      // Validate custom fields if OTHER was selected
      if (showCustomBranch && !formData.customBranch.trim()) {
        toast.error('Please enter your custom branch/department name');
        return;
      }
      
      if (showCustomProgram && !formData.customProgram.trim()) {
        toast.error('Please enter your custom program name');
        return;
      }

      // LinkedIn profile is mandatory for students
      if (!formData.linkedinProfile || !formData.linkedinProfile.includes('linkedin.com')) {
        toast.error('A valid LinkedIn profile URL (e.g. https://linkedin.com/in/yourname) is required');
        return;
      }
    }

    setLoading(true);


    try {
      const token = localStorage.getItem('token');
      const endpoint = userType === 'alumni' ? '/api/profile/alumni' : '/api/profile/student';
      
      // Get effective branch and program values (custom or selected)
      const effectiveBranch = showCustomBranch ? formData.customBranch : formData.branch;
      const effectiveProgram = showCustomProgram ? formData.customProgram : formData.program;
      
      // Prepare data based on user type
      const profileData = {
        full_name: user.full_name, // Use full name from user context
        age: parseInt(formData.age),
        branch: effectiveBranch,
        program: effectiveProgram,
        ...(userType === 'alumni' ? {
          passing_year: parseInt(formData.passingYear),
          previous_campus: formData.previousCampus,
          is_employed: formData.isEmployed,
          employer: formData.employer,
          position: formData.position,
          experience: formData.experience,
          linkedin_profile: formData.linkedInProfile,
          location: formData.location,
          // Higher education fields
          is_pursuing_higher_education: formData.isPursuingHigherEducation,
          current_institution: formData.currentInstitution,
          current_course: formData.currentCourse,
          institution_country: formData.institutionCountry,
          expected_graduation_year: formData.expectedGraduationYear ? parseInt(formData.expectedGraduationYear) : null,
          // Additional status fields
          is_preparing_competitive_exams: formData.isPreparingCompetitiveExams,
          competitive_exam_details: formData.competitiveExamDetails,
          is_seeking_opportunities: formData.isSeekingOpportunities,
          opportunity_preferences: formData.opportunityPreferences
        } : {
          rollNo: user.roll_no, // Use roll number from user context
          current_year: parseInt(formData.currentYear),
          semester: parseInt(formData.semester),
          cgpa: parseFloat(formData.cgpa),
          linkedin_profile: formData.linkedinProfile,
          github_profile: formData.githubProfile,
          skills: Array.isArray(formData.skills) 
            ? formData.skills 
            : (typeof formData.skills === 'string' && formData.skills.trim() 
                ? formData.skills.split(',').map(skill => skill.trim()).filter(skill => skill)
                : []
              ),
          projects: formData.projects,
          internships: formData.internships
        })
      };

      await api.put(endpoint, profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Profile saved successfully!');
      
      // Refresh auth state to get updated user data
      await checkAuthStatus();
      
      // Navigate to appropriate dashboard
      const dashboardPath = getDashboardPath();
      navigate(dashboardPath);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for managing projects
  const addProject = () => {
    setFormData({
      ...formData,
      projects: [...formData.projects, { name: '', description: '', deployed_link: '' }]
    });
  };

  const removeProject = (index) => {
    const newProjects = formData.projects.filter((_, i) => i !== index);
    setFormData({ ...formData, projects: newProjects });
  };

  const updateProject = (index, field, value) => {
    const newProjects = formData.projects.map((project, i) => 
      i === index ? { ...project, [field]: value } : project
    );
    setFormData({ ...formData, projects: newProjects });
  };

  // Helper functions for managing internships
  const addInternship = () => {
    setFormData({
      ...formData,
      internships: [...formData.internships, { company_name: '', position: '', description: '' }]
    });
  };

  const removeInternship = (index) => {
    const newInternships = formData.internships.filter((_, i) => i !== index);
    setFormData({ ...formData, internships: newInternships });
  };

  const updateInternship = (index, field, value) => {
    const newInternships = formData.internships.map((internship, i) => 
      i === index ? { ...internship, [field]: value } : internship
    );
    setFormData({ ...formData, internships: newInternships });
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Welcome to GB Pant College Alumni Portal! 👋
        </h3>
        <p className="text-slate-600 mb-6">
          Let's start by understanding your connection to GB Pant College
        </p>
      </div>
      
      <div className="space-y-4">
        <div
          onClick={() => setUserType('alumni')}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            userType === 'alumni'
              ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              userType === 'alumni' 
                ? 'bg-indigo-600 border-indigo-600' 
                : 'border-slate-300'
            }`}>
              {userType === 'alumni' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex items-center space-x-4 flex-1">
              <div className="text-3xl">🎓</div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Alumni</h4>
                <p className="text-sm text-slate-600">I have graduated from GB Pant College</p>
              </div>
            </div>
          </div>
        </div>
        
        <div
          onClick={() => setUserType('student')}
          className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
            userType === 'student'
              ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg'
              : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              userType === 'student' 
                ? 'bg-indigo-600 border-indigo-600' 
                : 'border-slate-300'
            }`}>
              {userType === 'student' && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex items-center space-x-4 flex-1">
              <div className="text-3xl">📚</div>
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Current Student</h4>
                <p className="text-sm text-slate-600">I am currently studying at GB Pant DSEU College</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">Complete Your Profile</h3>
        <p className="text-slate-600">We already have some information from your registration</p>
      </div>

      {/* Pre-filled Information Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200">
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <span className="mr-2">✅</span>
          Information Already Available
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Full Name</label>
            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium break-words">
              {user?.full_name || 'Not available'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Email Address</label>
            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium break-all overflow-hidden" title={user?.email}>
              {user?.email || 'Not available'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Mobile Number</label>
            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium">
              {user?.mobile || 'Not available'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Account Type</label>
            <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium flex items-center">
              <span className="mr-2">{userType === 'alumni' ? '🎓' : '📚'}</span>
              {userType === 'alumni' ? 'Alumni' : 'Current Student'}
            </div>
          </div>
          {userType === 'student' && user?.roll_no && (
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Roll Number</label>
              <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium">
                {user.roll_no}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Additional Information Section */}
      <div>
        <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <span className="mr-2">📝</span>
          Additional Information Required
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Age *
            </label>
            <input
              type="number"
              name="age"
              required
              min="15"
              max="100"
              value={formData.age}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
              placeholder="Your age"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Branch/Department *
        </label>
        <select
          name="branch"
          required={!showCustomBranch}
          value={showCustomBranch ? 'OTHER' : formData.branch}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
        >
          <option value="">Select your branch</option>
          {branches.map(branch => (
            <option key={branch} value={branch}>{branch}</option>
          ))}
          <option value="OTHER">OTHER (Enter custom branch)</option>
        </select>
        
        {showCustomBranch && (
          <div className="mt-3">
            <input
              type="text"
              name="customBranch"
              required
              value={formData.customBranch}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white"
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
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Program(You studied at GB Pant College) *
        </label>
        <select
          name="program"
          required={!showCustomProgram}
          value={showCustomProgram ? 'OTHER' : formData.program}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
        >
          <option value="">Select your program</option>
          {programs.map(program => (
            <option key={program} value={program}>{program}</option>
          ))}
          <option value="OTHER">OTHER (Enter custom program)</option>
        </select>
        
        {showCustomProgram && (
          <div className="mt-3">
            <input
              type="text"
              name="customProgram"
              required
              value={formData.customProgram}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-white"
              placeholder="Enter your program name (e.g., BCA, MCA, B.Sc CS, etc.)"
            />
          </div>
        )}
        
        {/* Help message */}
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">💡 Tip:</span> If your program is not in the list, choose "OTHER" and enter your specific program name.
          </p>
        </div>
      </div>

      {/* Campus Selection - Only for Alumni */}
      {userType === 'alumni' && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Campus Where You Studied *
          </label>
          <select
            name="previousCampus"
            required
            value={formData.previousCampus}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 bg-slate-50 focus:bg-white"
          >
            <option value="">Select your campus</option>
            <option value="GB Pant Institute of Technology(GBPIT)(Polytechnic)">
              GB Pant Institute of Technology(GBPIT)(Polytechnic)
            </option>
            <option value="GB Pant Engineering College(GBPEC)">
              GB Pant Engineering College(GBPEC)
            </option>
            <option value="GB Pant DSEU Campus">
              GB Pant DSEU Campus
            </option>
          </select>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📝 Note:</span> Students graduating from DSEU should choose "GB Pant DSEU Campus" for both Diploma and B.Tech alumni.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAlumniInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Alumni Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Passing Year *
        </label>
        <input
          type="number"
          name="passingYear"
          required
          min="1950"
          max={currentYear}
          value={formData.passingYear}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="Year of graduation"
        />
      </div>

      {/* Current Status Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-600 text-sm">📊</span>
          </span>
          Current Status
        </h4>
        <p className="text-sm text-gray-600 mb-4">Select all that apply to your current situation:</p>
        
        <div className="space-y-4">
          {/* Employment Status */}
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="isEmployed"
                checked={formData.isEmployed}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mt-1"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">💼 Currently Employed</span>
                <span className="text-xs text-gray-500">Working full-time, part-time, or freelancing</span>
              </div>
            </label>
          </div>

          {/* Higher Education Status */}
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="isPursuingHigherEducation"
                checked={formData.isPursuingHigherEducation}
                onChange={handleChange}
                className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50 mt-1"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">🎓 Pursuing Higher Education</span>
                <span className="text-xs text-gray-500">Currently enrolled in M.Tech, MBA, PhD, or other programs</span>
              </div>
            </label>
          </div>

          {/* Competitive Exam Preparation Status */}
          <div className="bg-white p-4 rounded-lg border border-orange-100">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="isPreparingCompetitiveExams"
                checked={formData.isPreparingCompetitiveExams}
                onChange={handleChange}
                className="rounded border-gray-300 text-orange-600 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50 mt-1"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">📚 Preparing for Competitive Exams</span>
                <span className="text-xs text-gray-500">GATE, CAT, UPSC, GRE, GMAT, or other competitive exams</span>
              </div>
            </label>
          </div>

          {/* Seeking Opportunities Status */}
          <div className="bg-white p-4 rounded-lg border border-green-100">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="isSeekingOpportunities"
                checked={formData.isSeekingOpportunities}
                onChange={handleChange}
                className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50 mt-1"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">🔍 Looking for Opportunities</span>
                <span className="text-xs text-gray-500">Seeking job opportunities, freelancing, or consulting work</span>
              </div>
            </label>
          </div>
        </div>

        {/* Status Summary */}
        {(formData.isEmployed || formData.isPursuingHigherEducation || formData.isPreparingCompetitiveExams || formData.isSeekingOpportunities) && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-700">
              <span className="font-medium">Current Status: </span>
              {(() => {
                const statuses = [];
                if (formData.isEmployed) statuses.push("Working Professional");
                if (formData.isPursuingHigherEducation) statuses.push("Student");
                if (formData.isPreparingCompetitiveExams) statuses.push("Exam Aspirant");
                if (formData.isSeekingOpportunities) statuses.push("Job Seeker");
                return statuses.join(" + ");
              })()}
            </div>
          </div>
        )}

        {!formData.isEmployed && !formData.isPursuingHigherEducation && !formData.isPreparingCompetitiveExams && !formData.isSeekingOpportunities && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Status: </span>
              Please select your current status
            </div>
          </div>
        )}
      </div>

      {/* Employment Details */}
      {formData.isEmployed && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm">💼</span>
            </span>
            Employment Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Employer *
              </label>
              <input
                type="text"
                name="employer"
                required={formData.isEmployed}
                value={formData.employer}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="Company/Organization name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position/Role *
              </label>
              <input
                type="text"
                name="position"
                required={formData.isEmployed}
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="Job title/designation"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience, Achievements & About you
            </label>
            <div className="space-y-1">
              <textarea
                name="experience"
                rows="4"
                value={formData.experience}
                onChange={handleChange}
                maxLength="500"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                  formData.experience?.length > 500 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Tell us about you in short, about you, your professional experience and achievements (max 500 characters)"
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Share your professional journey and achievements</span>
                <span className={`${
                  formData.experience?.length > 500 ? 'text-red-500 font-semibold' : 
                  formData.experience?.length > 450 ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {formData.experience?.length || 0}/500
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Higher Education Details */}
      {formData.isPursuingHigherEducation && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-purple-600 text-sm">🎓</span>
            </span>
            Higher Education Information
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Institution *
              </label>
              <input
                type="text"
                name="currentInstitution"
                required={formData.isPursuingHigherEducation}
                value={formData.currentInstitution}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g., Stanford University, IIT Delhi, AIIMS, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Course/Program *
              </label>
              <input
                type="text"
                name="currentCourse"
                required={formData.isPursuingHigherEducation}
                value={formData.currentCourse}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                placeholder="e.g., M.Tech Computer Science, MBA, PhD Physics, etc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Country *
                </label>
                <input
                  type="text"
                  name="institutionCountry"
                  required={formData.isPursuingHigherEducation}
                  value={formData.institutionCountry}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="e.g., India, USA, Canada, UK, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Graduation Year *
                </label>
                <input
                  type="number"
                  name="expectedGraduationYear"
                  required={formData.isPursuingHigherEducation}
                  min={currentYear}
                  max={currentYear + 10}
                  value={formData.expectedGraduationYear}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder={`e.g., ${currentYear + 2}`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Exam Preparation Details */}
      {formData.isPreparingCompetitiveExams && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 text-sm">📚</span>
            </span>
            Competitive Exam Preparation
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Details (Optional)
            </label>
            <div className="space-y-1">
              <textarea
                name="competitiveExamDetails"
                rows="3"
                value={formData.competitiveExamDetails}
                onChange={handleChange}
                maxLength="400"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                  formData.competitiveExamDetails?.length > 400 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Preparing for GATE 2026 (CSE), targeting IIT Delhi/Bombay for M.Tech. Also preparing for GRE for MS abroad. Expected exam dates: Feb 2026 (GATE), Dec 2025 (GRE). (You can add details later from your dashboard if you prefer to skip this for now)"
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Mention exam names, target dates, institutions, etc. (Optional - can be added later)</span>
                <span className={`${
                  formData.competitiveExamDetails?.length > 400 ? 'text-red-500 font-semibold' : 
                  formData.competitiveExamDetails?.length > 350 ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {formData.competitiveExamDetails?.length || 0}/400
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Seeking Details */}
      {formData.isSeekingOpportunities && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm">🔍</span>
            </span>
            Opportunity Preferences
          </h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opportunity Details (Optional)
            </label>
            <div className="space-y-1">
              <textarea
                name="opportunityPreferences"
                rows="3"
                value={formData.opportunityPreferences}
                onChange={handleChange}
                maxLength="400"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition ${
                  formData.opportunityPreferences?.length > 400 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Looking for Software Engineer roles in Tech companies (Google, Microsoft, Amazon). Open to remote work. Interested in Full-stack, Backend development. Preferred locations: Bangalore, Hyderabad, Remote. Also open to freelancing projects in web development. (You can add details later from your dashboard if you prefer to skip this for now)"
              />
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Specify job types, locations, industries, freelancing preferences, etc. (Optional - can be added later)</span>
                <span className={`${
                  formData.opportunityPreferences?.length > 400 ? 'text-red-500 font-semibold' : 
                  formData.opportunityPreferences?.length > 350 ? 'text-orange-500' : 'text-gray-400'
                }`}>
                  {formData.opportunityPreferences?.length || 0}/400
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-gray-600 text-sm">📋</span>
          </span>
          Additional Information
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              LinkedIn Profile
            </label>
            <input
              type="url"
              name="linkedInProfile"
              value={formData.linkedInProfile}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition"
              placeholder="City, State/Country"
            />
          </div>
        </div>
      </div>
      
      {/* Security Verification */}
      <div className="border-t pt-6">
        <Captcha 
          onVerify={handleCaptchaVerify}
          difficulty="medium"
        />
      </div>
    </div>
  );

  const renderStudentInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Student Information</h3>
      
      {/* Show pre-filled roll number */}
      <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
        <label className="block text-sm font-semibold text-slate-600 mb-1">Roll Number (From Registration)</label>
        <div className="px-4 py-3 bg-white rounded-xl border border-slate-200 text-slate-900 font-medium">
          {user?.roll_no || 'Not available'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Year *
          </label>
          <select
            name="currentYear"
            required
            value={formData.currentYear}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="">Select year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
            <option value="5">5th Year</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Semester *
          </label>
          <select
            name="semester"
            required
            value={formData.semester}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          >
            <option value="">Select semester</option>
            {[1,2,3,4,5,6,7,8,9,10].map(sem => (
              <option key={sem} value={sem}>{sem}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current CGPA
        </label>
        <input
          type="number"
          name="cgpa"
          step="0.01"
          min="0"
          max="10"
          value={formData.cgpa}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="9.50"
        />
      </div>

      {/* Social Media Links */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800">Social Media Links (Optional)</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile
          </label>
          <input
            type="url"
            name="linkedinProfile"
            value={formData.linkedinProfile}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GitHub Profile
          </label>
          <input
            type="url"
            name="githubProfile"
            value={formData.githubProfile}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="https://github.com/yourusername"
          />
        </div>
      </div>

      {/* Skills, Projects, and Experience Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-800 border-t pt-4">Skills & Experience (Optional)</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            name="skills"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            placeholder="JavaScript, React, Python, Java, etc."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Projects
            </label>
            <button
              type="button"
              onClick={addProject}
              className="flex items-center px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Project
            </button>
          </div>
          
          {formData.projects.map((project, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-700">Project {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeProject(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={project.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                
                <div className="space-y-1">
                  <textarea
                    placeholder="Project Description (max 300 characters)"
                    value={project.description}
                    onChange={(e) => updateProject(index, 'description', e.target.value)}
                    rows="2"
                    maxLength="300"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                      project.description?.length > 300 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Brief project overview</span>
                    <span className={`${
                      project.description?.length > 300 ? 'text-red-500 font-semibold' : 
                      project.description?.length > 250 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      {project.description?.length || 0}/300
                    </span>
                  </div>
                </div>
                
                <input
                  type="url"
                  placeholder="Deployed Link (optional)"
                  value={project.deployed_link}
                  onChange={(e) => updateProject(index, 'deployed_link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          ))}
          
          {formData.projects.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No projects added yet. Click "Add Project" to get started!</p>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Internships
            </label>
            <button
              type="button"
              onClick={addInternship}
              className="flex items-center px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Internship
            </button>
          </div>
          
          {formData.internships.map((internship, index) => (
            <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-sm font-medium text-gray-700">Internship {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeInternship(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={internship.company_name}
                  onChange={(e) => updateInternship(index, 'company_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                
                <input
                  type="text"
                  placeholder="Your Position"
                  value={internship.position}
                  onChange={(e) => updateInternship(index, 'position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                
                <div className="space-y-1">
                  <textarea
                    placeholder="Internship Description (max 300 characters)"
                    value={internship.description}
                    onChange={(e) => updateInternship(index, 'description', e.target.value)}
                    rows="2"
                    maxLength="300"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none ${
                      internship.description?.length > 300 ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Role details and achievements</span>
                    <span className={`${
                      internship.description?.length > 300 ? 'text-red-500 font-semibold' : 
                      internship.description?.length > 250 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      {internship.description?.length || 0}/300
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {formData.internships.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No internships added yet. Click "Add Internship" to get started!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Security Verification */}
      <div className="border-t pt-6">
        <Captcha 
          onVerify={handleCaptchaVerify}
          difficulty="medium"
        />
      </div>
    </div>
  );

  return (
    <Layout showNav={false}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 mx-auto">
              🎓
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Complete Your Profile</h2>
            <p className="text-slate-600">Help us customize your GB Pant College experience</p>
            
            {/* Progress bar */}
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-3">
                {[2, 3].map((stepNum, index) => (
                  <React.Fragment key={stepNum}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                      step >= stepNum
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {step > stepNum ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 rounded-full transition-all duration-200 ${
                        step > stepNum ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-slate-200'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8">
              {step === 2 && renderBasicInfo()}
              {step === 3 && userType === 'alumni' && renderAlumniInfo()}
              {step === 3 && userType === 'student' && renderStudentInfo()}
            </div>

            {/* Navigation */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex justify-between">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 2}
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>
              
              {step < 3 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !captchaVerified}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
