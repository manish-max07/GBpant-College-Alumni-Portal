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
  FaUsers,
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

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearStats, setYearStats] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 9;

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { user } = useAuth();
  const searchTimeoutRef = useRef(null);

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
      if (!token) return;

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedYear !== 'all') params.append('current_year', selectedYear);
      if (branchFilter !== 'all') params.append('branch', branchFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await api.get(`/api/profile/student-list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setStudents(response.data.students || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotalItems(response.data.pagination?.total || 0);
        setCurrentPage(response.data.pagination?.currentPage || page);
        if (response.data.batches) {
          setYearStats(response.data.batches);
          setTotalStudentsCount(response.data.batches.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0));
        }
      }
    } catch (error) {
      if (error.response?.status !== 403) toast.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedYear, branchFilter, semesterFilter, categoryFilter]);

  useEffect(() => {
    fetchStudentList(currentPage);
  }, [fetchStudentList, currentPage]);

  const handleYearSelect = (year) => { setSelectedYear(year); setCurrentPage(1); };
  const handlePageChange = (page) => { setCurrentPage(page); window.scrollTo({ top: 400, behavior: 'smooth' }); };
  const handleClearFilters = () => {
    setSearchTerm(''); setDebouncedSearch(''); setSelectedYear('all');
    setBranchFilter('all'); setSemesterFilter('all'); setCategoryFilter('all'); setCurrentPage(1);
  };
  const openModal = (student) => { setSelectedStudent(student); setShowModal(true); };
  const closeModal = () => { setSelectedStudent(null); setShowModal(false); };

  const branchesList = ['Computer Science & Engineering', 'Electronics & Communication Engineering', 'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering'];
  const getBatchLabel = (year) => `Batch of ${new Date().getFullYear() + (4 - parseInt(year))}`;

  return (
    <Layout showNav={true}>
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white py-16 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center mb-4 bg-white/10 backdrop-blur-md rounded-2xl p-4">
              <FaUserGraduate className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Student Directory</h1>
            <p className="text-blue-100 max-w-2xl mx-auto">Connect with current GB Pant College students for mentorship, internship guidance, and project collaborations.</p>
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 text-sm font-medium">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 border border-white/20">
                <FaUsers className="text-blue-200" /> <span>{totalStudentsCount || totalItems} Verified Students</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FaGraduationCap className="text-indigo-600" /> Browse by Academic Year
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <button onClick={() => handleYearSelect('all')} className={`p-4 rounded-2xl border ${selectedYear === 'all' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                <div className="font-bold">All Students</div>
              </button>
              {yearStats.map((y) => (
                <button key={y.year} onClick={() => handleYearSelect(String(y.year))} className={`p-4 rounded-2xl border ${selectedYear === String(y.year) ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                  <div className="font-bold">{getYearSuffix(y.year)} Year</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <input type="text" placeholder="Search by name, skills..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl outline-none" />
                <FaSearch className="absolute left-3 top-4 text-slate-400" />
              </div>
              <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }} className="px-3 py-3 bg-slate-50 border rounded-xl">
                <option value="all">All Branches</option>
                {branchesList.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <button onClick={handleClearFilters} className="py-3 bg-slate-100 rounded-xl font-semibold">Clear Filters</button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading directory...</div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student, idx) => (
                <div key={idx} onClick={() => openModal(student)} className="bg-white rounded-3xl shadow-sm border p-6 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <ProfileAvatar user={student} size="medium" />
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{student.full_name}</h3>
                      <p className="text-xs text-indigo-600 font-medium">{student.branch}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{getYearSuffix(student.current_year)} Year • Sem {student.semester}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {student.skills?.slice(0, 3).map((s, i) => <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-bold">{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border">No students found.</div>
          )}

          {totalPages > 1 && (
            <div className="mt-12"><Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={totalItems} itemsPerPage={itemsPerPage} itemType="students" /></div>
          )}
        </div>

        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.full_name}</h2>
                  <p className="text-indigo-600 font-medium">{selectedStudent.branch}</p>
                </div>
                <button onClick={closeModal} className="text-slate-400 p-2"><FaTimes /></button>
              </div>
              <div className="space-y-6">
                {selectedStudent.skills && (
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><FaCode className="text-indigo-600" /> Skills</h3>
                    <div className="flex flex-wrap gap-2">{selectedStudent.skills.map((s, i) => <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl">{s}</span>)}</div>
                  </div>
                )}
                <div className="flex gap-3">
                  {selectedStudent.linkedin_profile && <a href={selectedStudent.linkedin_profile} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-blue-600 text-white text-center rounded-xl font-bold text-xs">LinkedIn</a>}
                  {selectedStudent.github_profile && <a href={selectedStudent.github_profile} target="_blank" rel="noreferrer" className="flex-1 py-2.5 bg-slate-900 text-white text-center rounded-xl font-bold text-xs">GitHub</a>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
