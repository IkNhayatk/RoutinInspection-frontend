import React, { useState } from 'react';

const TodoForm = ({ onSubmit, initialData = null, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  // Split initial dueDate (ISO string) into date (YYYY-MM-DD) and time (HH:mm)
  const initialDate = initialData?.dueDate ? initialData.dueDate.slice(0, 10) : '';
  const initialTime = initialData?.dueDate ? initialData.dueDate.slice(11, 16) : '';
  const [dueDate, setDueDate] = useState(initialDate); 
  const [dueTime, setDueTime] = useState(initialTime);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Combine date and time, then convert to ISO string
    let combinedDateTime = null;
    if (dueDate && dueTime) {
      combinedDateTime = new Date(`${dueDate}T${dueTime}`).toISOString();
    } else if (dueDate) {
      // If only date is provided, default time to 00:00
      combinedDateTime = new Date(`${dueDate}T00:00:00.000Z`).toISOString(); 
    }
    
    onSubmit({
      title,
      description,
      priority,
      dueDate: combinedDateTime, // Use the combined value
      ...(initialData ? { id: initialData.id } : {})
    });

    // 如果不是編輯模式，清空表單
    if (!initialData) {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setDueTime(''); // Reset dueTime as well
    }
  };
  
  return (
    // Add dark mode background and text color
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 mb-6 text-gray-900 dark:text-gray-100">
      {/* Add dark mode text color */}
      <h2 className="text-xl font-semibold mb-4">{initialData ? '編輯待辦事項' : '新增待辦事項'}</h2>
      
      <div className="mb-4">
        {/* Add dark mode text color for label */}
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          標題 *
        </label>
        {/* Add dark mode styles for input */}
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          placeholder="輸入待辦事項標題"
          required
        />
      </div>
      
      <div className="mb-4">
        {/* Add dark mode text color for label */}
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        {/* Add dark mode styles for textarea */}
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          placeholder="輸入描述（選填）"
          rows="3"
        />
      </div>

      {/* Combined Date and Time inputs in one row */}
      {/* Combined Date and Time inputs */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          {/* Add dark mode text color for label */}
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            截止日期
          </label>
          {/* Add dark mode styles for date input */}
          <input
            id="dueDate"
            type="date" 
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          />
        </div>
        <div>
          {/* Add dark mode text color for label */}
          <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            截止時間
          </label>
          {/* Add dark mode styles for time input */}
          <input
            id="dueTime"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Priority Select */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          {/* Add dark mode text color for label */}
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            優先級
          </label>
          {/* Add dark mode styles for select */}
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
          >
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        {/* Cancel Button */}
        {initialData && (
          // Add dark mode styles for cancel button
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            取消
          </button>
        )}
        
        {/* Submit Button */}
        {/* Add dark mode styles for submit button */}
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        >
          {initialData ? '更新' : '新增'}
        </button>
      </div>
    </form>
  );
};

export default TodoForm;
