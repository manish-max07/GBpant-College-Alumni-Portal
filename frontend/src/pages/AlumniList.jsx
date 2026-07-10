import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuth } from '../hooks/useAuth';
import { 
  FaSearch, 
  FaLinkedin, 
  FaBuilding, 
  FaGraduationCap, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaFilter,
  FaUsers,
  FaBriefcase,
  FaStar,
  FaExternalLinkAlt,
  FaBookOpen,
  FaBullseye,
  FaHandshake
} from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function AlumniList() {
  const [alumni, setAlumni] = useState([]);
  const [filteredAlumni, setFilteredAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Helper functions to get unique filter options
  const getUniqueBranches = () => {
    const branches = alumni.filter(person => person.branch).map(person => person.branch);
    return [...new Set(branches)].sort();
  };

  const getUniqueGraduationYears = () => {
    const years = alumni.filter(person => person.passing_year).map(person => person.passing_year);
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const getUniqueLocations = () => {
    const locations = new Set();
    alumni.forEach(person => {
      if (person.current_location) {
        locations.add(person.current_location);
      }
      if (person.institution_country && person.is_pursuing_higher_education) {
        locations.add(person.institution_country);
      }
    });
    return [...locations].sort();
  };

  const getUniqueCampuses = () => {
    const campuses = alumni.filter(person => person.campus).map(person => person.campus);
    return [...new Set(campuses)].sort();
  };

  const getUniquePrograms = () => {
    const programs = alumni.filter(person => person.program).map(person => person.program);
    return [...new Set(programs)].sort();
  };

  useEffect(() => {
    fetchAlumniList();
  }, []);

  useEffect(() => {
    filterAlumniList();
  }, [searchTerm, filterBy, branchFilter, yearFilter, locationFilter, campusFilter, programFilter, alumni]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBy, branchFilter, yearFilter, locationFilter, campusFilter, programFilter]);

  const fetchAlumniList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/api/profile/alumni-list', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAlumni(response.data.alumni);
        setFilteredAlumni(response.data.alumni);
      } else {
        toast.error('Failed to load alumni list');
      }
    } catch (error) {
      toast.error('Failed to load alumni list');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        // Let ProtectedRoute handle redirect
      }
    } finally {
      setLoading(false);
    }
  };

  const filterAlumniList = () => {
    let filtered = alumni;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(person => 
        person.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.employer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.current_institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.current_course?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.institution_country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.competitive_exam_details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.opportunity_preferences?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(person => {
        if (filterBy === 'employed') return person.is_employed;
        if (filterBy === 'studying') return person.is_pursuing_higher_education;
        if (filterBy === 'preparing-exams') return person.is_preparing_competitive_exams;
        if (filterBy === 'seeking-opportunities') return person.is_seeking_opportunities;
        if (filterBy === 'recent') return person.passing_year >= new Date().getFullYear() - 5;
        if (filterBy === 'experienced') return person.passing_year < new Date().getFullYear() - 5;
        return true;
      });
    }

    // Apply branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(person => person.branch === branchFilter);
    }

    // Apply graduation year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(person => person.passing_year === parseInt(yearFilter));
    }

    // Apply location filter (includes current location and institution country)
    if (locationFilter !== 'all') {
      filtered = filtered.filter(person => 
        person.current_location === locationFilter || 
        (person.institution_country === locationFilter && person.is_pursuing_higher_education)
      );
    }

    // Apply campus filter
    if (campusFilter !== 'all') {
      filtered = filtered.filter(person => person.campus === campusFilter);
    }

    // Apply program filter
    if (programFilter !== 'all') {
      filtered = filtered.filter(person => person.program === programFilter);
    }

    setFilteredAlumni(filtered);
  };

  const getYearsOfExperience = (passingYear) => {
    return new Date().getFullYear() - passingYear;
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlumni = filteredAlumni.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <HiOutlineAcademicCap className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                Alumni Directory
              </h1>
              <p className="text-blue-100 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2">
                Connect with GB Pant College alumni working at top companies worldwiden or studying at top universities.
                Discover career opportunities and build your professional network.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-blue-100 text-sm sm:text-base">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{alumni.length} Alumni</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaBriefcase className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{alumni.filter(a => a.is_employed).length} Employed</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaBookOpen className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{alumni.filter(a => a.is_preparing_competitive_exams).length} Preparing</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaHandshake className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{alumni.filter(a => a.is_seeking_opportunities).length} Seeking</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12">
            <div className="flex flex-col gap-4 sm:gap-6">
              {/* Search Input */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search alumni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              
              {/* Advanced Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Category Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaFilter className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                  >
                    <option value="all">All Status</option>
                    <option value="employed">Currently Employed</option>
                    <option value="studying">Pursuing Higher Education</option>
                    <option value="preparing-exams">Preparing for Competitive Exams</option>
                    <option value="seeking-opportunities">Seeking Opportunities</option>
                    <option value="recent">Recent Graduates</option>
                    <option value="experienced">Experienced</option>
                  </select>
                </div>

                {/* Branch Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaBriefcase className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                  >
                    <option value="all">All Branches</option>
                    {getUniqueBranches().map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>

                {/* Graduation Year Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaCalendarAlt className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                  >
                    <option value="all">All Years</option>
                    {getUniqueGraduationYears().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Location Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                  >
                    <option value="all">All Locations</option>
                    {getUniqueLocations().map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Program Filter */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <HiOutlineAcademicCap className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                  >
                    <option value="all">All Programs</option>
                    {getUniquePrograms().map(program => (
                      <option key={program} value={program}>{program}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters & Results Summary */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  {(searchTerm || filterBy !== 'all' || branchFilter !== 'all' || yearFilter !== 'all' || locationFilter !== 'all' || programFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilterBy('all');
                        setBranchFilter('all');
                        setYearFilter('all');
                        setLocationFilter('all');
                        setProgramFilter('all');
                      }}
                      className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg sm:rounded-xl transition-colors font-medium text-sm gap-2"
                    >
                      <span>Clear All Filters</span>
                      <span className="text-xs bg-slate-200 px-2 py-1 rounded-full">
                        {[searchTerm, filterBy !== 'all', branchFilter !== 'all', yearFilter !== 'all', locationFilter !== 'all', programFilter !== 'all'].filter(Boolean).length}
                      </span>
                    </button>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-blue-200 flex-shrink-0">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-700">{filteredAlumni.length}</div>
                    <div className="text-xs sm:text-sm text-blue-600 font-medium">Alumni Found</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Alumni Grid */}
          {filteredAlumni.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {currentAlumni.map((person, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 ease-in-out"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <ProfileAvatar 
                          user={person}
                          size="medium"
                          showStatusBadge={true}
                          statusBadgeProps={{
                            show: person.is_employed,
                            icon: FaStar,
                            className: "bg-green-500"
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {person.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 mt-1">
                          <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{person.branch}</span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="truncate hidden sm:inline">{person.program}</span>
                        </div>
                        <div className="sm:hidden text-xs text-slate-500 mt-0.5 truncate">
                          {person.program}
                        </div>
                      </div>
                    </div>
                    {person.is_employed && (
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 flex-shrink-0 ml-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1.5 sm:mr-2 animate-pulse"></div>
                        <span className="hidden sm:inline">Employed</span>
                        <span className="sm:hidden">✓</span>
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-3 sm:space-y-4">
                    {person.employer && person.position && (
                      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-slate-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FaBriefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight line-clamp-2">
                              {person.position}
                            </h4>
                            <p className="text-slate-700 font-medium mt-1 flex items-center gap-1.5 sm:gap-2 text-sm">
                              <FaBuilding className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                              <span className="truncate">{person.employer}</span>
                            </p>
                          </div>
                        </div>
                        {person.location && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                            <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{person.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Higher Education Section */}
                    {person.is_pursuing_higher_education && person.current_institution && (
                      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-purple-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <HiOutlineAcademicCap className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-purple-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                              {person.current_course || 'Higher Studies'}
                            </h4>
                            <p className="text-slate-700 font-medium mt-1 flex items-center gap-1.5 sm:gap-2 text-sm">
                              <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                              <span className="truncate">{person.current_institution}</span>
                            </p>
                            {person.institution_country && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600 mt-1">
                                <FaMapMarkerAlt className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{person.institution_country}</span>
                                {person.expected_graduation_year && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-xs">Graduating {person.expected_graduation_year}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Competitive Exam Preparation Section */}
                    {person.is_preparing_competitive_exams && (
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-orange-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FaBookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                              Preparing for Competitive Exams
                            </h4>
                            {person.competitive_exam_details && (
                              <p className="text-slate-700 text-sm mt-1 leading-relaxed">
                                {person.competitive_exam_details}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Seeking Opportunities Section */}
                    {person.is_seeking_opportunities && (
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-teal-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-teal-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FaHandshake className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                              Seeking Opportunities
                            </h4>
                            {person.opportunity_preferences && (
                              <p className="text-slate-700 text-sm mt-1 leading-relaxed">
                                {person.opportunity_preferences}
                              </p>
                            )}
                            {person.availability_status && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal-600 mt-1">
                                <FaBullseye className="w-3 h-3 sm:w-4 sm:h-4 text-teal-500 flex-shrink-0" />
                                <span className="font-medium">{person.availability_status}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Indicator */}
                    {(person.is_employed || person.is_pursuing_higher_education || person.is_preparing_competitive_exams || person.is_seeking_opportunities) && (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm flex-wrap">
                          {person.is_employed && (
                            <div className="flex items-center gap-1">
                              <FaBriefcase className="w-3 h-3 text-blue-600" />
                              <span className="text-blue-700 font-medium">Working</span>
                            </div>
                          )}
                          {person.is_pursuing_higher_education && (
                            <>
                              {person.is_employed && <span className="text-gray-400">+</span>}
                              <div className="flex items-center gap-1">
                                <HiOutlineAcademicCap className="w-3 h-3 text-purple-600" />
                                <span className="text-purple-700 font-medium">Studying</span>
                              </div>
                            </>
                          )}
                          {person.is_preparing_competitive_exams && (
                            <>
                              {(person.is_employed || person.is_pursuing_higher_education) && <span className="text-gray-400">+</span>}
                              <div className="flex items-center gap-1">
                                <FaBookOpen className="w-3 h-3 text-orange-600" />
                                <span className="text-orange-700 font-medium">Preparing</span>
                              </div>
                            </>
                          )}
                          {person.is_seeking_opportunities && (
                            <>
                              {(person.is_employed || person.is_pursuing_higher_education || person.is_preparing_competitive_exams) && <span className="text-gray-400">+</span>}
                              <div className="flex items-center gap-1">
                                <FaHandshake className="w-3 h-3 text-teal-600" />
                                <span className="text-teal-700 font-medium">Seeking</span>
                              </div>
                            </>
                          )}
                          {!person.is_employed && !person.is_pursuing_higher_education && !person.is_preparing_competitive_exams && !person.is_seeking_opportunities && (
                            <div className="flex items-center gap-1">
                              <FaGraduationCap className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-600 font-medium">GB Pant Alumnus</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="text-center p-2.5 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                          <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-600">Graduated</span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900">{person.passing_year}</div>
                      </div>
                      <div className="text-center p-2.5 sm:p-3 bg-slate-50 rounded-lg sm:rounded-xl">
                        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                          <FaBriefcase className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" />
                          <span className="text-xs sm:text-sm font-medium text-slate-600">Experience</span>
                        </div>
                        <div className="text-base sm:text-lg font-bold text-slate-900">{getYearsOfExperience(person.passing_year)} yrs</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer - LinkedIn Button */}
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
                    {person.linkedin_profile ? (
                      <a
                        href={person.linkedin_profile}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all duration-200 font-semibold text-sm group shadow-lg hover:shadow-xl"
                      >
                        <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="hidden sm:inline">Connect on LinkedIn</span>
                        <span className="sm:hidden">LinkedIn</span>
                        <FaExternalLinkAlt className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-2 opacity-70" />
                      </a>
                    ) : (
                      <div className="w-full inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-100 text-slate-500 rounded-xl sm:rounded-2xl cursor-not-allowed font-semibold text-sm">
                        <FaLinkedin className="w-4 h-4 sm:w-5 sm:h-5 mr-2 opacity-50" />
                        <span className="hidden sm:inline">LinkedIn Not Available</span>
                        <span className="sm:hidden">Not Available</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={filteredAlumni.length}
                    itemsPerPage={itemsPerPage}
                    itemType="alumni"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 lg:py-24 px-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl mx-auto mb-6 sm:mb-8 shadow-lg">
                <FaUsers className="text-slate-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">No Alumni Found</h3>
              <p className="text-slate-600 max-w-md mx-auto text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                {searchTerm || filterBy !== 'all' || branchFilter !== 'all' || yearFilter !== 'all' || locationFilter !== 'all' || programFilter !== 'all'
                  ? 'Try adjusting your search terms or filters to find alumni.'
                  : 'No alumni profiles are available at the moment.'}
              </p>
              {(searchTerm || filterBy !== 'all' || branchFilter !== 'all' || yearFilter !== 'all' || locationFilter !== 'all' || programFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterBy('all');
                    setBranchFilter('all');
                    setYearFilter('all');
                    setLocationFilter('all');
                    setProgramFilter('all');
                  }}
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
