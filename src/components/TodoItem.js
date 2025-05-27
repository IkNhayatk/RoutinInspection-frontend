import React from 'react';
import { useTheme } from '../context/ThemeContext.js'; // Import useTheme

const TodoItem = ({ todo, onStatusChange, onDelete, onEdit }) => {
  const { theme } = useTheme(); // Get current theme

  // Define colors for both light and dark modes
  const statusColors = {
    light: {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
    },
    dark: {
      pending: 'bg-yellow-900 text-yellow-200',
      completed: 'bg-green-900 text-green-200',
    }
  };
  
  const priorityColors = {
    light: {
      high: 'text-red-600',
      medium: 'text-orange-500',
      low: 'text-blue-500',
    },
    dark: {
      high: 'text-red-400',
      medium: 'text-orange-400',
      low: 'text-blue-400',
    }
  };

  // Get current theme's colors
  const currentStatusColors = statusColors[theme];
  const currentPriorityColors = priorityColors[theme];

  return (
    // Add dark mode background, border, and text colors
    <div className="border dark:border-gray-700 rounded-lg p-4 mb-3 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition text-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-start"> {/* Use items-start for better alignment */}
        <div className="flex-1 mr-4"> {/* Add margin-right */}
          {/* Add dark mode text color, adjust completed style */}
          <h3 className={`text-lg font-semibold ${todo.status === 'completed' ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {todo.title}
          </h3>
          
          {todo.description && (
            // Add dark mode text color
            <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{todo.description}</p>
          )}
          
          <div className="flex flex-wrap mt-2 gap-2"> {/* Use flex-wrap and gap */}
            {/* Use current theme's status colors */}
            <span className={`text-xs px-2 py-1 rounded ${currentStatusColors[todo.status] || 'bg-gray-100 dark:bg-gray-700'}`}>
              {todo.status === 'pending' ? '待處理' : '已完成'}
            </span>
            
            {/* Use current theme's priority colors and background */}
            <span className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 ${currentPriorityColors[todo.priority] || ''}`}>
              {todo.priority === 'high' ? '高優先級' : 
               todo.priority === 'medium' ? '中優先級' : '低優先級'}
            </span>
            
            {todo.dueDate && (
              // Add dark mode background and text color
              <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                截止: {new Date(todo.dueDate).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-end sm:items-center"> {/* Adjust layout for responsiveness */}
          {/* Add dark mode styles for status toggle button */}
          <button
            onClick={() => onStatusChange(todo.id, todo.status === 'pending' ? 'completed' : 'pending')}
            className={`px-3 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
              todo.status === 'completed' 
                ? 'text-yellow-500 dark:text-yellow-400' 
                : 'text-green-500 dark:text-green-400'
            }`}
          >
            {todo.status === 'completed' ? '標記待辦' : '標記完成'} {/* Shorter text */}
          </button>
          
          {/* Add dark mode styles for edit button */}
          <button
            onClick={() => onEdit(todo)}
            className="px-3 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition text-blue-500 dark:text-blue-400"
          >
            編輯
          </button>
          
          {/* Add dark mode styles for delete button */}
          <button
            onClick={() => onDelete(todo.id)}
            className="px-3 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition text-red-500 dark:text-red-400"
          >
            刪除
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoItem;
