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
          style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.2))' }}
        />
      </div>
    </Link>
  );
};

export default Logo;
