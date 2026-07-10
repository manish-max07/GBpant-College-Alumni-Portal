import React from 'react';

const ProfileAvatar = ({ 
  user, 
  size = 'medium', 
  className = '',
  showStatusBadge = false,
  statusType = 'employed', // 'employed' or 'verified'
  statusIcon = null
}) => {
  // Size configurations for list cards
  const sizeConfig = {
    small: { container: 'w-8 h-8', text: 'text-sm', badge: 'w-3 h-3' },
    medium: { container: 'w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16', text: 'text-lg sm:text-xl lg:text-2xl', badge: 'w-5 h-5 sm:w-6 sm:h-6' },
    large: { container: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-2xl sm:text-3xl', badge: 'w-6 h-6 sm:w-8 sm:h-8' }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      {/* Profile Picture or Initial */}
      <div className={`${config.container} rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg`}>
        {user?.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt={`${user.full_name}'s profile`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`${config.text} font-bold text-white`}>
            {getInitials(user?.full_name)}
          </span>
        )}
      </div>

      {/* Status Badge */}
      {showStatusBadge && (
        <div className={`absolute -top-1 -right-1 ${config.badge} bg-green-500 rounded-full flex items-center justify-center`}>
          {statusIcon}
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
