import React from 'react';
import { useNavigate } from 'react-router';
import { logout } from '../services/authService.js';

function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <button 
      onClick={handleLogout}
      data-testid="logout-button"
      className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-800 transition flex items-center justify-center"
      aria-label="登出"
      title="登出"
    >
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 503.808 503.808" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Door/Box Background */}
        <path 
          d="M327.704,251.075v51.2v128c0,18.773-15.36,34.133-34.133,34.133h-153.6V37.741h153.6c18.773,0,34.133,15.36,34.133,34.133V251.075z" 
          fill="currentColor"
          opacity="0.3"
        />
        
        {/* Side Panel */}
        <path 
          d="M139.971,37.741v426.667v8.533c0,18.773-13.653,29.867-29.867,23.893l-81.067-32.427c-19.627-6.827-25.6-15.36-25.6-34.133v-358.4c0-18.773,6.827-27.307,25.6-34.133l81.067-32.427c16.213-5.973,29.867,5.12,29.867,23.893V37.741z" 
          fill="currentColor"
          opacity="0.5"
        />
        
        {/* Main Outline */}
        <path 
          d="M119.637,503.808c-3.413,0-6.827-0.853-10.24-1.707L28.33,469.675c-20.48-7.68-28.16-17.92-28.16-38.4v-358.4c0-20.48,7.68-30.72,28.16-38.4l81.067-32.427c8.533-3.413,17.067-2.56,23.893,2.56c7.68,5.12,11.947,14.507,11.947,25.6v443.733c0,11.093-4.267,20.48-11.947,25.6C129.877,502.101,124.757,503.808,119.637,503.808z" 
          fill="currentColor"
        />
        
        {/* Exit Arrow */}
        <path 
          d="M414.037,341.675c-0.853,0-2.56,0-3.413-0.853c-1.707-1.707-1.707-4.267,0-5.973l77.653-77.653H192.171c-2.56,0-4.267-1.707-4.267-4.267c0-2.56,1.707-4.267,4.267-4.267h296.96l-77.653-77.653c-1.707-1.707-1.707-4.267,0-5.973c1.707-1.707,4.267-1.707,5.973,0l85.333,85.333c0,0,0.853,0.853,0.853,1.707l0,0l0,0c0,0.853,0,0.853,0,1.707l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0l0,0c0,0.853,0,0.853,0,1.707l0,0l0,0c0,0.853-0.853,0.853-0.853,0.853l0,0l0,0l0,0l0,0l0,0l-85.333,85.333C416.597,340.821,414.891,341.675,414.037,341.675z" 
          fill="currentColor"
        />
      </svg>
      登出
    </button>
  );
}

export default LogoutButton;
