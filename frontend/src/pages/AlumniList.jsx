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
  FaLinkedin, 
  FaBuilding, 
  FaGraduationCap, 
  FaCalendarAlt,
  FaUsers,
  FaBriefcase,
  FaStar,
  FaExternalLinkAlt,
  FaBookOpen,
  FaHandshake,
  FaTimes
} from 'react-icons/fa';
import { HiOutlineAcademicCap } from 'react-icons/hi';

export default function AlumniList() {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [batchStats, setBatchStats] = useState([]);
  const [totalAlumniCount, setTotalAlumniCount] = useState(0);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Server pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const navigate = useNavigate();
  const { user } = useAuth();
  const searchTimeoutRef = useRef(null);

  // Debounce search input (350ms)
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchTerm]);

  // Fetch alumni list from backend with server-side pagination & filtering
  const fetchAlumniList = useCallback(async (page = 1) => {
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
      if (selectedBatch !== 'all') params.append('passing_year', selectedBatch);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (programFilter !== 'all') params.append('program', programFilter);
      if (locationFilter !== 'all') params.append('location', locationFilter);

      const response = await api.get(`/api/profile/alumni-list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        let fetched = response.data.alumni || [];

        // Client-side status filter if specified
        if (statusFilter !== 'all') {
          fetched = fetched.filter(person => {
            if (statusFilter === 'employed') return person.is_employed;
            if (statusFilter === 'studying') return person.is_pursuing_higher_education;
            if (statusFilter === 'preparing-exams') return person.is_preparing_competitive_exams;
            if (statusFilter === 'seeking-opportunities') return person.is_seeking_opportunities;
            return true;
          });
        }

        setAlumni(fetched);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
          setTotalItems(response.data.pagination.total || 0);
          setCurrentPage(response.data.pagination.currentPage || page);
        }
        if (response.data.batches && response.data.batches.length > 0) {
          setBatchStats(response.data.batches);
          const totalFromBatches = response.data.batches.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0);
          setTotalAlumniCount(totalFromBatches);
        }
      } else {
        toast.error('Failed to load alumni list');
      }
    } catch (error) {
      if (error.response?.status !== 403) {
        toast.error('Failed to load alumni list');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedBatch, branchFilter, programFilter, locationFilter, statusFilter]);

  useEffect(() => {
    fetchAlumniList(currentPage);
  }, [fetchAlumniList, currentPage]);

  const handleBatchSelect = (batchYear) => {
    setSelectedBatch(batchYear);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedBatch('all');
    setBranchFilter('all');
    setLocationFilter('all');
    setProgramFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const getYearsOfExperience = (passingYear) => {
    if (!passingYear) return 0;
    return Math.max(0, new Date().getFullYear() - passingYear);
  };

  const branchesList = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Mechanical Engineering',
    'Electrical Engineering',
    'Civil Engineering'
  ];

  return (
    <Layout showNav={true}>
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/50 min-h-screen">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center mb-4 bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/20 shadow-inner">
                <HiOutlineAcademicCap className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight">
                Alumni Directory
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                Connect with GB Pant College alumni across graduating batches, top industries, and global universities.
              </p>
              
              {/* Quick stats pill */}
              <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-medium">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/25">
                  <FaUsers className="text-blue-200" />
                  <span>{totalAlumniCount || totalItems} Verified Alumni</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-1.5 border border-white/25">
                  <FaGraduationCap className="text-amber-300" />
                  <span>{batchStats.length} Graduating Batches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {/* 🎓 BATCH-WISE EXPLORATION SECTION */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <FaGraduationCap className="text-indigo-600" />
                  Browse by Graduation Batch
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                  Filter alumni by passing year or view the entire directory
                </p>
              </div>
              {selectedBatch !== 'all' && (
                <button
                  onClick={() => handleBatchSelect('all')}
                  className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-semibold underline decoration-2"
                >
                  Reset to All Batches
                </button>
              )}
            </div>

            {/* Batch Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* "All Alumni" Card */}
              <button
                onClick={() => handleBatchSelect('all')}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${
                  selectedBatch === 'all'
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-200 scale-[1.02]'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">🌟</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    selectedBatch === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {totalAlumniCount || totalItems}
                  </span>
                </div>
                <div className="font-bold text-sm sm:text-base leading-snug">All Batches</div>
                <div className={`text-xs mt-0.5 ${selectedBatch === 'all' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  Full Directory
                </div>
              </button>

              {/* Dynamic Batch Cards from Backend */}
              {batchStats.map((b) => {
                const isSelected = selectedBatch === String(b.year);
                return (
                  <button
                    key={b.year}
                    onClick={() => handleBatchSelect(String(b.year))}
                    className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${
                      isSelected
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-transparent shadow-lg shadow-blue-200 scale-[1.02]'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">🎓</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {b.count}
                      </span>
                    </div>
                    <div className="font-bold text-sm sm:text-base leading-snug">Batch of {b.year}</div>
                    <div className={`text-xs mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      Class of {b.year}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search and Filters Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-8">
            <div className="flex flex-col gap-4">
              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <FaSearch className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, company, job role, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-10 py-3.5 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder-slate-400 text-sm sm:text-base bg-slate-50/50"
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

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {/* Branch */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
                  <select
                    value={branchFilter}
                    onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Branches</option>
                    {branchesList.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="employed">Currently Employed</option>
                    <option value="studying">Pursuing Higher Education</option>
                    <option value="preparing-exams">Preparing for Exams</option>
                    <option value="seeking-opportunities">Seeking Opportunities</option>
                  </select>
                </div>

                {/* Program */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => { setProgramFilter(e.target.value); setCurrentPage(1); }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Programs</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>

                {/* Clear Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleClearFilters}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filter Bar & Results count */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalItems}</span>
              <span>alumni found</span>
              {selectedBatch !== 'all' && (
                <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  Batch: {selectedBatch}
                  <button onClick={() => handleBatchSelect('all')} className="hover:text-indigo-900 ml-1">×</button>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </div>
          </div>

          {/* Alumni Grid / Loading / Empty */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-slate-500 text-sm">Loading alumni directory...</p>
            </div>
          ) : alumni.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {alumni.map((person, index) => (
                  <div
                    key={index}
                    className="group bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top row: Avatar + Name + Badge */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative shrink-0">
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
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {person.full_name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <FaGraduationCap className="text-indigo-500 shrink-0" />
                            <span className="truncate">{person.branch}</span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Batch of {person.passing_year} • {person.program}
                          </div>
                        </div>
                      </div>

                      {/* Employment / Higher Studies pill */}
                      {person.is_employed && person.employer ? (
                        <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-3.5 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                              <FaBriefcase className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-slate-500">Working at</div>
                              <div className="text-sm font-bold text-slate-900 truncate">{person.employer}</div>
                              {person.position && (
                                <div className="text-xs text-blue-700 font-medium truncate">{person.position}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : person.is_pursuing_higher_education && person.current_institution ? (
                        <div className="bg-purple-50/70 border border-purple-100 rounded-2xl p-3.5 mb-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                              <FaBookOpen className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs text-slate-500">Studying at</div>
                              <div className="text-sm font-bold text-slate-900 truncate">{person.current_institution}</div>
                              {person.current_course && (
                                <div className="text-xs text-purple-700 font-medium truncate">{person.current_course}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-4 text-xs text-slate-500 flex items-center gap-2">
                          <FaBuilding className="text-slate-400" />
                          <span>GB Pant College Alumnus</span>
                        </div>
                      )}

                      {/* Location & Experience details */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                          <FaCalendarAlt className="text-indigo-400 shrink-0" />
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Batch</div>
                            <div className="font-bold text-slate-800">{person.passing_year}</div>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-2">
                          <FaBriefcase className="text-blue-400 shrink-0" />
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Experience</div>
                            <div className="font-bold text-slate-800">{getYearsOfExperience(person.passing_year)} yrs</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LinkedIn connect button */}
                    <div className="pt-4 border-t border-slate-100">
                      {person.linkedin_profile ? (
                        <a
                          href={person.linkedin_profile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all group-hover:scale-[1.01]"
                        >
                          <FaLinkedin className="text-base" />
                          <span>Connect on LinkedIn</span>
                          <FaExternalLinkAlt className="text-[10px] opacity-80 ml-1" />
                        </a>
                      ) : (
                        <div className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl font-medium text-xs text-center">
                          LinkedIn Not Linked
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Server-Side Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    itemType="alumni"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 text-slate-400">
                <FaUsers />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Alumni Found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                No alumni match your current search or batch filters. Try adjusting your criteria.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
