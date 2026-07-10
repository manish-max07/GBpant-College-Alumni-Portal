import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'p-6', 
  rounded = 'rounded-2xl',
  shadow = 'shadow-sm',
  border = 'border border-slate-200',
  background = 'bg-white',
  ...props 
}) => {
  const baseClasses = `${background} ${rounded} ${shadow} ${border} ${padding}`;
  const hoverClasses = hover 
    ? 'hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300' 
    : 'transition-all duration-200';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
