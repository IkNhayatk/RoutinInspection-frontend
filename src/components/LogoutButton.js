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
      className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-800 transition flex items-center justify-center"
      aria-label="登出"
      title="登出"
    >
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Door */}
        <path 
          d="M10.5 2h-5C4.7 2 4 2.7 4 3.5v17c0 .8.7 1.5 1.5 1.5h5c.8 0 1.5-.7 1.5-1.5v-17c0-.8-.7-1.5-1.5-1.5z" 
          fill="currentColor"
        />
        
        {/* Door knob */}
        <circle 
          cx="6.5" 
          cy="12" 
          r="1" 
          className="fill-gray-700 dark:fill-white"
        />
        
        {/* Door frame top and bottom */}
        <path 
          d="M12 8V4h3v4M12 16v4h3v-4" 
          stroke="currentColor" 
          strokeWidth="2" 
          fill="none"
        />
        
        {/* Arrow */}
        <path 
          d="M22 12l-6-4v3h-4v2h4v3z" 
          fill="currentColor"
        />
      </svg>
      登出
    </button>
  );
}

export default LogoutButton;
