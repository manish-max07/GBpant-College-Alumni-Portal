import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage,
  itemType = "items"
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = isMobile ? 3 : 5; // Show 3 on mobile, 5 on desktop
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const sidePages = isMobile ? 1 : 2; // 1 page on each side for mobile, 2 for desktop
      let startPage = Math.max(1, currentPage - sidePages);
      let endPage = Math.min(totalPages, currentPage + sidePages);
      
      // Adjust if we're near the start or end
      if (currentPage <= (sidePages + 1)) {
        endPage = Math.min(totalPages, maxPagesToShow);
      }
      
      if (currentPage > totalPages - sidePages) {
        startPage = Math.max(1, totalPages - (maxPagesToShow - 1));
      }
      
      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        <div className="text-sm text-slate-600 order-2 sm:order-1">
          Showing <span className="font-semibold text-slate-900">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-900">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-900">{totalItems}</span> {itemType}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2 order-1 sm:order-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
              currentPage === 1
                ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                : 'border-slate-300 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
            }`}
          >
            <FaChevronLeft className="w-3 h-3" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <div className="flex items-center justify-center w-10 h-10 text-slate-400">
                    ...
                  </div>
                ) : (
                  <button
                    onClick={() => onPageChange(page)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 text-sm font-medium ${
                      currentPage === page
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'border-slate-300 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 ${
              currentPage === totalPages
                ? 'border-slate-200 text-slate-400 cursor-not-allowed bg-slate-50'
                : 'border-slate-300 text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
            }`}
          >
            <FaChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mobile-optimized pagination for small screens */}
      <div className="sm:hidden mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentPage === 1
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            <FaChevronLeft className="w-3 h-3 mr-2" />
            Previous
          </button>
          
          <div className="text-sm text-slate-600 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentPage === totalPages
                ? 'text-slate-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            Next
            <FaChevronRight className="w-3 h-3 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
