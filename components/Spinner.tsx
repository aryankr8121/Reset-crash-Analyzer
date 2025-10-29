import React from 'react';

interface SpinnerProps {
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-cyan-400 ${sizeClasses[size]}`}></div>
      {text && <p className="ml-3 text-gray-400">{text}</p>}
    </div>
  );
};

export default Spinner;