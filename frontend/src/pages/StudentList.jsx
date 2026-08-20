import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  FaGraduationCap, 
  FaCalendarAlt,
  FaFilter,
  FaUsers,
  FaBookOpen,
  FaStar,
  FaTrophy,
  FaCode,
  FaUserGraduate,
  FaLinkedin,
  FaGithub,
  FaExternalLinkAlt,
  FaTimes,
  FaBuilding,
  FaProjectDiagram,
  FaBriefcase
} from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearStats, setYearStats] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Server pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const searchTimeoutRef = useRef(null);

  // Helper function to ensure proper URL format
  const formatUrl = (url) => {
    if (!url || url.trim() === '') return '';
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    return `https://${trimmedUrl}`;
  };

  const getYearSuffix = (year) => {
    const suffixes = ['st', 'nd', 'rd'];
    const lastDigit = year % 10;
    const suffix = (lastDigit <= 3 && (year < 11 || year > 13)) ? suffixes[lastDigit - 1] : 'th';
    return `${year}${suffix}`;
  };

  // Debounce search input (350ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  const fetchStudentList = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);

      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedYear !== 'all') params.append('current_year', selectedYear);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);

      const response = await api.get(`/api/profile/student-list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        let fetchedStudents = response.data.students || [];

        // Apply client-side category filters if requested
        if (categoryFilter !== 'all') {
          fetchedStudents = fetchedStudents.filter(student => {
            if (categoryFilter === 'final_year') return student.current_year >= 4;
            if (categoryFilter === 'junior') return student.current_year <= 2;
            if (categoryFilter === 'high_cgpa') return student.cgpa >= 8.0;
            if (categoryFilter === 'has_internship') return student.internships && student.internships.length > 0;
            if (categoryFilter === 'has_projects') return student.projects && student.projects.length > 0;
            if (categoryFilter === 'has_social') return student.linkedin_profile || student.github_profile;
            return true;
          });
        }

        setStudents(fetchedStudents);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.total || 0);
          setCurrentPage(response.data.pagination.currentPage || page);
        }
        if (response.data.batches && response.data.batches.length > 0) {
          setYearStats(response.data.batches);
          const totalFromYears = response.data.batches.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0);
          setTotalStudentsCount(totalFromYears);
        }
      } else {
        toast.error('Failed to load student list');
      }
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error('Failed to load student list');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedYear, branchFilter, semesterFilter, categoryFilter]);

  useEffect(() => {
    fetchStudentList(currentPage);
  }, [fetchStudentList, currentPage]);

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedYear('all');
    setBranchFilter('all');
    setSemesterFilter('all');
    setCategoryFilter('all');
    setCurrentPage(1);
  };

  const openModal = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedStudent(null);
    setShowModal(false);
  };

  const branchesList = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering'
  ];

  const getBatchLabel = (year) => {
    const currentYear = new Date().getFullYear();
    const gradYear = currentYear + (4 - parseInt(year));
    return `Batch of ${gradYear}`;
  };

  return (
    <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
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
                  <FaUserGraduate className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
                Student Directory
              </h1>
              <p className="text-blue-100 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-2">
                Connect with current GB Pant College students across all years and branches. 
                Discover talented individuals for mentorship and collaboration opportunities.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 text-blue-100 text-sm sm:text-base">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaUsers className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{totalStudentsCount || totalItems} Students</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>{yearStats.length} Academic Years</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white bg-opacity-10 rounded-lg px-3 py-1.5 sm:px-4 sm:py-2">
                  <FaTrophy className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                  <span>High Achievers & Projects</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FaGraduationCap className="text-indigo-600" />
                  Browse by Academic Year / Batch
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Filter students by study year and graduating class
                </p>
              </div>
              {selectedYear !== 'all' && (
                <button
                  onClick={() => handleYearSelect('all')}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2"
                >
                  Reset to All Students
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              <button
                onClick={() => handleYearSelect('all')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                  selectedYear === 'all'
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent shadow-lg scale-[1.02]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🌟</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedYear === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {totalStudentsCount || totalItems}
                  </span>
                </div>
                <div className="font-bold text-sm sm:text-base leading-snug">All Students</div>
                <div className={`text-xs mt-0.5 ${selectedYear === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Full Directory
                </div>
              </button>

              {yearStats.map((y) => {
                const isSelected = selectedYear === String(y.year);
                return (
                  <button
                    key={y.year}
                    onClick={() => handleYearSelect(String(y.year))}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">🎓</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {y.count}
                      </span>
                    </div>
                    <div className="font-bold text-sm sm:text-base leading-snug">{getYearSuffix(y.year)} Year</div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {getBatchLabel(y.year)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 lg:mb-12">
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <FaSearch className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students by name, branch, skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder-slate-500 text-sm sm:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaFilter className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <select
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                    >
                      <option value="all">All Categories</option>
                      <option value="final_year">Final Year Students</option>
                      <option value="junior">Junior Students</option>
                      <option value="high_cgpa">High Achievers (8+ CGPA)</option>
                      <option value="has_internship">With Internships</option>
                      <option value="has_projects">With Projects</option>
                      <option value="has_social">With Social Media Links</option>
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaCalendarAlt className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <select
                      value={selectedYear}
                      onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                    >
                      <option value="all">All Years</option>
                      {yearStats.map(y => (
                        <option key={y.year} value={y.year}>
                          {getYearSuffix(y.year)} Year
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaBookOpen className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <select
                      value={semesterFilter}
                      onChange={(e) => { setSemesterFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                    >
                      <option value="all">All Semesters</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(semester => (
                        <option key={semester} value={semester}>
                          Semester {semester}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaGraduationCap className="text-slate-400 w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <select
                      value={branchFilter}
                      onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 sm:pl-12 pr-8 py-3 sm:py-4 border border-slate-300 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-slate-900 text-sm sm:text-base"
                    >
                      <option value="all">All Branches</option>
                      {branchesList.map(branch => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-all"
                  >
                    Clear All Filters
                  </button>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-200">
                    <div className="text-center">
                      <span className="font-bold text-blue-700">{totalItems}</span>
                      <span className="text-xs text-blue-600 ml-1 font-medium">Students Found</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
              <p className="text-slate-500 text-sm">Loading student directory...</p>
            </div>
          ) : students.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {students.map((student, index) => (
                <div
                  key={index}
                  className={`group bg-white rounded-2xl sm:rounded-3xl shadow-lg border ${
                    student.isDeveloper 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50' 
                      : 'border-slate-200'
                  } p-4 sm:p-6 lg:p-8 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 ease-in-out ${
                    student.isDeveloper ? 'ring-2 ring-purple-200' : ''
                  }`}
                >
                  {student.isDeveloper && (
                    <div className="mb-4 flex justify-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-semibold shadow-lg border border-purple-300">
                        <FaCode className="w-3 h-3" />
                        <span>Platform Developer</span>
                        <span className="text-purple-200">✨</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <ProfileAvatar 
                          user={student}
                          size="medium"
                          showStatusBadge={false}
                        />
                        {(student.projects?.length > 0 || student.internships?.length > 0) && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <FaStar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          </div>
                        )}
                        {student.isDeveloper && (
                          <div className="absolute -bottom-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                            <FaCode className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                          </div>
                        )}
                        {(student.linkedin_profile || student.github_profile) && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                            <FaExternalLinkAlt className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {student.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 mt-1">
                          <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{student.branch}</span>
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          <span className="truncate hidden sm:inline">{student.program}</span>
                        </div>
                        <div className="sm:hidden text-xs text-slate-500 mt-0.5 truncate">
                          {student.program}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="text-sm sm:text-base font-bold text-blue-600">
                          {getYearSuffix(student.current_year)} Year
                        </div>
                        <div className="text-xs text-slate-500">
                          Sem {student.semester}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {student.projects && student.projects.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-blue-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FaProjectDiagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                                Projects ({student.projects.length})
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {student.projects.slice(0, 2).map((project, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 sm:p-3 border border-blue-100">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                        {project.name}
                                      </h5>
                                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                                        {project.description}
                                      </p>
                                    </div>
                                    {project.deployed_link && (
                                      <a
                                        href={formatUrl(project.deployed_link)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                                        title="View Project"
                                      >
                                        <FaExternalLinkAlt className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {student.internships && student.internships.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 border border-green-100">
                        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 flex-shrink-0">
                            <FaBriefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight">
                                Internships ({student.internships.length})
                              </h4>
                            </div>
                            <div className="space-y-2">
                              {student.internships.slice(0, 2).map((internship, idx) => (
                                <div key={idx} className="bg-white rounded-lg p-2 sm:p-3 border border-green-100">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                          {internship.position}
                                        </h5>
                                        <span className="text-xs text-slate-500">at</span>
                                        <span className="font-medium text-green-700 text-xs sm:text-sm truncate">
                                          {internship.company_name}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 line-clamp-2">
                                        {internship.description}
                                      </p>
                                    </div>
                                    <FaBuilding className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {(student.skills?.length > 0 || student.interests?.length > 0) && (
                      <div className="space-y-2 sm:space-y-3">
                        {student.skills?.length > 0 && (
                          <div>
                            <h5 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                              <FaCode className="w-3 h-3 text-indigo-600" />
                              Skills
                            </h5>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {student.skills.slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-medium">
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 4 && (
                                <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg border border-slate-200 font-medium">
                                  +{student.skills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {student.interests?.length > 0 && (
                          <div>
                            <h5 className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                              <FaStar className="w-3 h-3 text-yellow-600" />
                              Interests
                            </h5>
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {student.interests.slice(0, 3).map((interest, idx) => (
                                <span key={idx} className="inline-block px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 font-medium">
                                  {interest}
                                </span>
                              ))}
                              {student.interests.length > 3 && (
                                <span className="inline-block px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg border border-slate-200 font-medium">
                                  +{student.interests.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <div className="text-center">
                          <div className={`text-lg sm:text-xl font-bold ${student.projects?.length > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                            {student.projects?.length || 0}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">Projects</div>
                        </div>
                        <div className="w-px h-8 bg-slate-200"></div>
                        <div className="text-center">
                          <div className={`text-lg sm:text-xl font-bold ${student.internships?.length > 0 ? 'text-green-700' : 'text-slate-400'}`}>
                            {student.internships?.length || 0}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">Internships</div>
                        </div>
                      </div>
                      
                      {((student.projects?.length > 2) || (student.internships?.length > 2) || (student.skills?.length > 4) || (student.interests?.length > 3)) && (
                        <button
                          onClick={() => openModal(student)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Show More
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-600">
                        <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        <span>Class of {new Date().getFullYear() + (5 - student.current_year)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {student.linkedin_profile && (
                          <a
                            href={student.linkedin_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                            title="Connect on LinkedIn"
                          >
                            <FaLinkedin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs sm:text-sm font-medium text-blue-700 hidden sm:inline">LinkedIn</span>
                          </a>
                        )}
                        
                        {student.github_profile && (
                          <a
                            href={student.github_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200"
                            title="View GitHub Profile"
                          >
                            <FaGithub className="w-3 h-3 sm:w-4 sm:h-4 text-gray-700 group-hover:scale-110 transition-transform" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">GitHub</span>
                          </a>
                        )}
                        
                        {!student.linkedin_profile && !student.github_profile && (
                          <button
                            onClick={() => openModal(student)}
                            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-slate-500 hover:text-indigo-600"
                          >
                            <FaUsers className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Details</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8 sm:mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    itemType="students"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 sm:py-16 lg:py-24 px-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl sm:rounded-3xl flex items-center justify-center text-4xl sm:text-5xl lg:text-6xl mx-auto mb-6 sm:mb-8 shadow-lg">
                <FaUserGraduate className="text-slate-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">No Students Found</h3>
              <p className="text-slate-600 max-w-md mx-auto text-base sm:text-lg leading-relaxed mb-4 sm:mb-6">
                {searchTerm || categoryFilter !== 'all' || selectedYear !== 'all' || semesterFilter !== 'all' || branchFilter !== 'all'
                  ? 'Try adjusting your search terms or filters to find students.'
                  : 'No student profiles are available at the moment.'}
              </p>
              {(searchTerm || categoryFilter !== 'all' || selectedYear !== 'all' || semesterFilter !== 'all' || branchFilter !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl sm:rounded-2xl hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>

        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white rounded-t-2xl sm:rounded-t-3xl border-b border-slate-200 p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <ProfileAvatar 
                        user={selectedStudent}
                        size="large"
                        showStatusBadge={false}
                      />
                      {selectedStudent.isDeveloper && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white">
                          <FaCode className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{selectedStudent.full_name}</h2>
                      <p className="text-slate-600 text-sm sm:text-base">{selectedStudent.branch}</p>
                      <p className="text-slate-500 text-sm">{selectedStudent.program} • Sem {selectedStudent.semester} • {getYearSuffix(selectedStudent.current_year)} Year</p>
                      {selectedStudent.isDeveloper && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full text-xs font-semibold mt-2">
                          <FaCode className="w-3 h-3" />
                          <span>Platform Developer</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {(selectedStudent.skills?.length > 0 || selectedStudent.interests?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedStudent.skills?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <FaCode className="w-5 h-5 text-indigo-600" />
                          Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.skills.map((skill, idx) => (
                            <span key={idx} className="inline-block px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStudent.interests?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <FaStar className="w-5 h-5 text-yellow-600" />
                          Interests
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedStudent.interests.map((interest, idx) => (
                            <span key={idx} className="inline-block px-3 py-1.5 text-sm bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 font-medium">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedStudent.projects?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FaProjectDiagram className="w-5 h-5 text-blue-600" />
                      Projects ({selectedStudent.projects.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.projects.map((project, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <h4 className="font-semibold text-slate-900 text-base">{project.name}</h4>
                            {project.deployed_link && (
                              <a
                                href={formatUrl(project.deployed_link)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-100"
                                title="View Project"
                              >
                                <FaExternalLinkAlt className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{project.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedStudent.internships?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FaBriefcase className="w-5 h-5 text-green-600" />
                      Internships ({selectedStudent.internships.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedStudent.internships.map((internship, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <h4 className="font-semibold text-slate-900 text-base">{internship.position}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <FaBuilding className="w-4 h-4 text-green-500" />
                                <span className="font-medium text-green-700">{internship.company_name}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">{internship.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedStudent.linkedin_profile || selectedStudent.github_profile) && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Connect</h3>
                    <div className="flex gap-3">
                      {selectedStudent.linkedin_profile && (
                        <a
                          href={selectedStudent.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-all duration-200"
                        >
                          <FaLinkedin className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">LinkedIn</span>
                        </a>
                      )}
                      
                      {selectedStudent.github_profile && (
                        <a
                          href={selectedStudent.github_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200"
                        >
                          <FaGithub className="w-4 h-4 text-gray-700" />
                          <span className="text-sm font-medium text-gray-700">GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
