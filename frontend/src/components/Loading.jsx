import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'indigo' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };
  
  const colors = {
    indigo: 'border-indigo-200 border-t-indigo-600',
    purple: 'border-purple-200 border-t-purple-600',
    blue: 'border-blue-200 border-t-blue-600',
    green: 'border-green-200 border-t-green-600',
    red: 'border-red-200 border-t-red-600',
    gray: 'border-gray-200 border-t-gray-600',
  };
  
  return (
    <div className={`animate-spin rounded-full border-4 ${sizes[size]} ${colors[color]}`}></div>
  );
};

const Loading = ({ 
  type = 'page', 
  message = 'Loading...', 
  submessage = '',
  showLogo = true,
  size = 'md'
}) => {
  if (type === 'inline') {
    return (
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-slate-600">{message}</span>
      </div>
    );
  }
  
  if (type === 'button') {
    return (
      <div className="flex items-center justify-center space-x-2">
        <LoadingSpinner size="sm" color="white" />
        <span>{message}</span>
      </div>
    );
  }
  
  // Default page loading
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        {showLogo && (
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 mx-auto animate-pulse shadow-lg border border-gray-100">
            <img 
              src="/logo1.png" 
              alt="GB Pant Alumni Portal" 
              className="w-12 h-12 object-contain"
            />
          </div>
        )}
        <LoadingSpinner size={size} />
        <p className="text-slate-600 font-medium mt-4">{message}</p>
        {submessage && (
          <p className="text-slate-500 text-sm mt-2">{submessage}</p>
        )}
      </div>
    </div>
  );
};

export { LoadingSpinner };
export default Loading;
