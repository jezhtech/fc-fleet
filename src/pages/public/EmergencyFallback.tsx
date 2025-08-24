import React from 'react';
import { Link } from 'react-router-dom';

const EmergencyFallback = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <img 
        src="/lovable-uploads/dbb328b3-31d8-4aa9-b1b1-3a081c9757d8.png" 
        alt="First Class Fleet Logo" 
        className="w-24 h-24 mb-6"
      />
      
      <h1 className="text-3xl font-bold mb-4">
        <span className="text-red-600">First Class</span> Fleet
      </h1>
      
      <p className="text-lg text-gray-600 max-w-md text-center mb-8">
        Welcome to First Class Fleet, your reliable ride and rental solution.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
        <Link 
          to="/login" 
          className="bg-red-600 text-white text-center py-3 px-6 rounded-lg font-medium hover:bg-red-700 transition"
        >
          Login
        </Link>
        
        <Link 
          to="/register" 
          className="bg-gray-200 text-gray-800 text-center py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Register
        </Link>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <p className="text-sm text-gray-500 mb-2">Having trouble with the application?</p>
        <button 
          onClick={() => window.location.reload()} 
          className="text-red-600 underline text-sm hover:text-red-800"
        >
          Refresh the page
        </button>
      </div>
    </div>
  );
};

export default EmergencyFallback; 