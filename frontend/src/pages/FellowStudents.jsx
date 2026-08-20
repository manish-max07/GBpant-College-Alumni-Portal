import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import ProfileAvatar from '../components/ProfileAvatar';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FaGraduationCap,
  FaUsers,
  FaSearch,
  FaLinkedin,
  FaChevronLeft,
  FaChevronRight,
  FaUserGraduate,
  FaTimes,
  FaBuilding,
  FaCompass
} from 'react-icons/fa';

const FellowStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [yearStats, setYearStats] = useState([]);

  // Server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 12;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchFellowStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
      });

      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedYear !== 'all') params.append('current_year', selectedYear);
      if (branchFilter !== 'all') params.append('branch', branchFilter);

      const response = await api.get(`/api/profile/fellow-students?${params.toString()}`);
      if (response.data.success) {
        setStudents(response.data.students || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.total || 0);
        }
        if (response.data.batches && response.data.batches.length > 0) {
          setYearStats(response.data.batches);
        }
      } else {
        toast.error(response.data.message || 'Failed to load students');
      }
    } catch (error) {
      console.error('Error fetching fellow students:', error);
      toast.error(error.response?.data?.message || 'Error fetching fellow students');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedYear, branchFilter]);

  useEffect(() => {
    fetchFellowStudents();
  }, [fetchFellowStudents]);

  const branchesList = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering'
  ];

  const getYearSuffix = (year) => {
    const y = parseInt(year);
    if (y === 1) return '1st';
    if (y === 2) return '2nd';
    if (y === 3) return '3rd';
    if (y === 4) return '4th';
    return `${y}th`;
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedYear('all');
    setBranchFilter('all');
    setCurrentPage(1);
  };

  const formatUrl = (url) => {
    if (!url || url.trim() === '') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const totalStudentsCount = yearStats.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);

  return (
    <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full translate-x-1/3 translate-y-1/3"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4 shadow-inner">
                <FaUserGraduate className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                Fellow Students Directory
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed px-2">
                Discover and network with your fellow classmates and peers across academic years and branches at GB Pant College.
              </p>

              {/* Stats badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-blue-100 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <FaUsers className="w-4 h-4 text-blue-300" />
                  <span>{totalStudentsCount || totalItems} Registered Peers</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <FaGraduationCap className="w-4 h-4 text-indigo-300" />
                  <span>{yearStats.length || 4} Academic Years</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <FaCompass className="w-4 h-4 text-emerald-300" />
                  <span>Peer Networking</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

          {/* Academic Year Quick Filter Buttons */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FaGraduationCap className="text-indigo-600" />
                  Browse by Academic Year
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm">Filter students by their current year of study</p>
              </div>
              {selectedYear !== 'all' && (
                <button
                  onClick={() => handleYearSelect('all')}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2"
                >
                  Reset to All
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {/* All Students Button */}
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
              </button>

              {/* Year Wise Buttons */}
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
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Branch Filter Bar */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Search Bar */}
              <div className="md:col-span-7 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaSearch className="text-slate-400 w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search by student name or branch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 placeholder-slate-400 text-sm transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Branch Filter Dropdown */}
              <div className="md:col-span-5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaBuilding className="text-slate-400 w-4 h-4" />
                </div>
                <select
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-8 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-slate-800 text-sm transition-all"
                >
                  <option value="all">All Branches</option>
                  {branchesList.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Summary Bar */}
            {(debouncedSearch || selectedYear !== 'all' || branchFilter !== 'all') && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">
                  Showing <strong>{totalItems}</strong> matching students
                </span>
                <button
                  onClick={handleClearFilters}
                  className="text-red-600 hover:text-red-800 font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>

          {/* Student Cards Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
              <p className="text-slate-500 text-sm font-medium">Loading fellow students...</p>
            </div>
          ) : students.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 p-5 flex flex-col justify-between group"
                  >
                    {/* Top Row: Avatar & Basic Info */}
                    <div>
                      <div className="flex items-start gap-4 mb-3">
                        <div className="relative flex-shrink-0">
                          <ProfileAvatar
                            user={student}
                            size="medium"
                            showStatusBadge={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {student.full_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              {getYearSuffix(student.current_year)} Year
                            </span>
                            <span className="text-xs text-slate-500 font-medium truncate">
                              {student.program || 'B.Tech'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Branch Info */}
                      <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">Department</p>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          {student.branch || 'Engineering'}
                        </p>
                        {student.semester && (
                          <p className="text-xs text-slate-500 mt-1 font-medium">
                            Semester {student.semester}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action: Connect on LinkedIn */}
                    <div className="pt-2">
                      {student.linkedin_profile ? (
                        <a
                          href={formatUrl(student.linkedin_profile)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#0A66C2] hover:bg-[#084e96] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 group/btn"
                        >
                          <FaLinkedin className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                          <span>Connect on LinkedIn</span>
                        </a>
                      ) : (
                        <div className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl text-sm font-medium text-center cursor-not-allowed border border-slate-200">
                          LinkedIn Not Linked
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <div className="text-xs sm:text-sm text-slate-500 font-medium">
                    Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total students)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <FaChevronLeft className="w-3 h-3" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() => {
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <span>Next</span>
                      <FaChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FaUsers className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">No Fellow Students Found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                {searchTerm || selectedYear !== 'all' || branchFilter !== 'all'
                  ? 'Try adjusting your search criteria or clearing filters to see more students.'
                  : 'There are currently no other approved students in the directory.'}
              </p>
              {(searchTerm || selectedYear !== 'all' || branchFilter !== 'all') && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors"
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
};

export default FellowStudents;
