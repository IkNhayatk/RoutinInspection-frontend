import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import Sidebar from '../components/Layout/Sidebar.js';
import TodoItem from '../components/TodoItem.js';
import TodoForm from '../components/TodoForm.js';
import LogoutButton from '../components/LogoutButton.js';
import { getTodos, addTodo, updateTodoStatus, updateTodo, deleteTodo, getTodoStats } from '../services/todoService.js';
import { useAuth } from '../context/AuthContext.js';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTodo, setEditingTodo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每頁顯示 10 個項目
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [formVisible, setFormVisible] = useState(false); // 控制表單顯示/隱藏
  // 新增: 待辦事項統計數據狀態
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    canceled: 0
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // 檢查是否已登入
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    // 載入待辦事項，傳入當前頁碼、過濾條件和搜尋關鍵字
    loadTodos(currentPage, searchTerm);
    
    // 新增: 載入待辦事項統計
    loadTodoStats();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, filter, currentPage, searchTerm]); // 更新依賴項
  
  // 當編輯待辦事項時，自動展開表單
  useEffect(() => {
    if (editingTodo) {
      setFormVisible(true);
    }
  }, [editingTodo]);
  
  // 新增: 載入待辦事項統計數據的函數
  const loadTodoStats = async () => {
    try {
      const result = await getTodoStats();
      if (result.success) {
        setStats(result.stats);
      } else {
        console.error('獲取待辦事項統計失敗:', result.message);
      }
    } catch (err) {
      console.error('載入統計數據時發生錯誤:', err);
    }
  };
  
  const loadTodos = async (page = 1, search = '') => { // 添加 page 和 search 參數
    setLoading(true);
    setError('');
    
    try {
      // 將 page, itemsPerPage, filter, search 傳遞給 getTodos
      const result = await getTodos(filter, page, itemsPerPage, search); 
      if (result.success) {
        setTodos(result.todos);
        // 從後端獲取總頁數並更新狀態
        setTotalPages(result.totalPages || 1); 
      } else {
        setError(result.message || '獲取待辦事項失敗');
      }
    } catch (err) {
      setError('無法連接到伺服器');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddTodo = async (todoData) => {
    try {
      const result = await addTodo(todoData);
      if (result.success) {
        setTodos([result.todo, ...todos]);
        // 新增成功後收起表單
        setFormVisible(false);
        // 新增: 重新載入統計數據
        loadTodoStats();
      } else {
        setError(result.message || '添加待辦事項失敗');
      }
    } catch (err) {
      setError('無法連接到伺服器');
      console.error(err);
    }
  };
  
  const handleStatusChange = async (todoId, newStatus) => {
    try {
      const result = await updateTodoStatus(todoId, newStatus);
      if (result.success) {
        setTodos(todos.map(todo => 
          todo.id === todoId ? { ...todo, status: newStatus } : todo
        ));
        // 新增: 重新載入統計數據
        loadTodoStats();
      } else {
        setError(result.message || '更新狀態失敗');
      }
    } catch (err) {
      setError('無法連接到伺服器');
      console.error(err);
    }
  };
  
  const handleDelete = async (todoId) => {
    if (!window.confirm('確定要刪除這個待辦事項嗎？')) return;
    
    try {
      const result = await deleteTodo(todoId);
      if (result.success) {
        setTodos(todos.filter(todo => todo.id !== todoId));
        // 新增: 重新載入統計數據
        loadTodoStats();
      } else {
        setError(result.message || '刪除待辦事項失敗');
      }
    } catch (err) {
      setError('無法連接到伺服器');
      console.error(err);
    }
  };
  
  const handleEdit = (todo) => {
    setEditingTodo(todo);
    // 滾動到頁面頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleUpdateTodo = async (todoData) => {
    try {
      const result = await updateTodo(todoData.id, todoData);
      if (result.success) {
        setTodos(todos.map(todo => 
          todo.id === todoData.id ? result.todo : todo
        ));
        setEditingTodo(null);
        // 更新成功後收起表單
        setFormVisible(false);
        // 新增: 重新載入統計數據
        loadTodoStats();
      } else {
        setError(result.message || '更新待辦事項失敗');
      }
    } catch (err) {
      setError('無法連接到伺服器');
      console.error(err);
    }
  };
  
  const handleFormCancel = () => {
    setEditingTodo(null);
    // 如果在新增模式下取消，則也收起表單
    if (!editingTodo) {
      setFormVisible(false);
    }
  };
  
  return (
    // Add dark mode background
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isAdmin={isAdmin} />
      
      {/* Add dark mode text color */}
      <div className="flex-1 overflow-auto text-gray-900 dark:text-gray-100">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            {/* Add dark mode text color */}
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">待辦事項</h1>
            <LogoutButton />
          </div>
          
          {error && (
            // Add dark mode styles for error message
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
              {error}
            </div>
          )}
          
          {/* Toggle Form Button */}
          <div className="mb-4">
            {/* Add dark mode styles for toggle button */}
            <button 
              onClick={() => setFormVisible(!formVisible)}
              className="px-4 py-2 bg-slate-600 dark:bg-slate-700 text-white dark:text-gray-200 rounded-md hover:bg-slate-700 dark:hover:bg-slate-600 transition flex items-center"
            >
              {formVisible ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  收起表單
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  新增待辦事項
                </>
              )}
            </button>
          </div>
          
          {/* Form visibility handled by state */}
          {formVisible && (
            <TodoForm 
              onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo} 
              initialData={editingTodo}
              onCancel={handleFormCancel}
            />
          )}

          {/* Search Input */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="搜尋待辦事項..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              // Add dark mode styles for search input
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>
          
          {/* Filter Buttons with Counts */}
          <div className="flex space-x-2 mb-4">
            {/* Add dark mode styles for filter buttons and include counts */}
            <button
              onClick={() => { setFilter('all'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'all' 
                  ? 'bg-slate-500 dark:bg-slate-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              全部 ({stats.total})
            </button>
            <button
              onClick={() => { setFilter('pending'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'pending' 
                  ? 'bg-slate-500 dark:bg-slate-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              待處理 ({stats.pending})
            </button>
            <button
              onClick={() => { setFilter('completed'); setCurrentPage(1); }}
              className={`px-3 py-1 rounded-md transition ${
                filter === 'completed' 
                  ? 'bg-slate-500 dark:bg-slate-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              已完成 ({stats.completed})
            </button>
          </div>
          
          {/* Loading Indicator */}
          {loading ? (
            <div className="text-center py-10">
              {/* Add dark mode border color */}
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 dark:border-indigo-400"></div>
              {/* Add dark mode text color */}
              <p className="mt-2 text-gray-500 dark:text-gray-400">載入中...</p>
            </div>
          ) : todos.length === 0 ? (
            // Add dark mode background and text color for "No todos" message
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
              <p className="text-gray-500 dark:text-gray-400">沒有待辦事項</p>
            </div>
          ) : (
            <div>
              {todos.map(todo => (
                <TodoItem 
                  key={todo.id} 
                  todo={todo} 
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && todos.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-4">
              {/* Add dark mode styles for pagination buttons */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-indigo-500 dark:bg-indigo-600 text-white rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition"
              >
                上一頁
              </button>
              {/* Add dark mode text color */}
              <span className="text-gray-700 dark:text-gray-300">
                第 {currentPage} / {totalPages} 頁
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-indigo-500 dark:bg-indigo-600 text-white rounded-md hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition"
              >
                下一頁
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodoList;
