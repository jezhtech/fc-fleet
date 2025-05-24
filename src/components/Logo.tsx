
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center">
        <img 
          src="/lovable-uploads/dbb328b3-31d8-4aa9-b1b1-3a081c9757d8.png" 
          alt="First Class Fleet Logo" 
          className="w-full h-full"
        />
      </div>
      <span className="font-bold text-xl">
        <span className="text-fleet-red">First Class</span>
        <span className="text-fleet-dark"> Fleet</span>
      </span>
    </Link>
  );
};

export default Logo;
