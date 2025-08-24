import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <div className="h-16 flex items-center justify-center">
        <img 
          src="/assets/logo.png" 
          alt="First Class Fleet Logo" 
          className="h-full object-contain"
        />
      </div>
    </Link>
  );
};

export default Logo;
