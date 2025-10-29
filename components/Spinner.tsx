
import React from 'react';

interface SpinnerProps {
    text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text }) => {
  return (
    <div className="flex items-center justify-center my-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      {text && <p className="ml-3 text-gray-400">{text}</p>}
    </div>
  );
};

export default Spinner;
