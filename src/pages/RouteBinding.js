import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import { useAuth } from '../context/AuthContext.js'; // Import useAuth
import { apiClient } from '../services/authService.js';
import { FaSearch, FaRegFolderOpen, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import CreateRouteModal from '../components/CreateRouteModal.js';
import ConfirmModal from '../components/ConfirmModal.js';

function RouteBinding() {
  const { isAdmin } = useAuth(); // Get isAdmin status
  
  // 狀態管理
  const [searchTerm, setSearchTerm] = useState('');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);

  // 載入路線資料
  useEffect(() => {
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        // 假設API有路線列表的端點
        const response = await apiClient.get(`/routes?page=${currentPage}&limit=${rowsPerPage}&search=${searchTerm}`);
        if (response.data.success) {
          setRoutes(response.data.routes || []);
          setTotalItems(response.data.total || 0);
        } else {
          console.error('Failed to fetch routes:', response.data.message);
          setRoutes([]);
          setTotalItems(0);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
        setRoutes([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutes();
  }, [currentPage, rowsPerPage, searchTerm]);

  // 搜尋處理
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  // 分頁處理
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // 編輯路線
  const handleEditRoute = (route) => {
    setEditingRoute(route);
    setIsModalOpen(true);
  };

  // 刪除路線
  const handleDeleteRoute = (route) => {
    setRouteToDelete(route);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (routeToDelete) {
      try {
        await apiClient.delete(`/routes/${routeToDelete.id}`);
        // 成功刪除後更新路線列表
        setRoutes(routes.filter(route => route.id !== routeToDelete.id));
      } catch (error) {
        console.error('Error deleting route:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setRouteToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setRouteToDelete(null);
  };

  // 模態框處理
  const handleOpenCreateModal = () => {
    setEditingRoute(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
  };

  // 提交路線資料
  const handleRouteSubmit = async (routeData) => {
    const isEditing = !!editingRoute;
    try {
      if (isEditing) {
        // 編輯現有路線
        await apiClient.put(`/routes/${editingRoute.id}`, routeData);
      } else {
        // 新增路線
        await apiClient.post('/routes', routeData);
      }
      
      // 重新載入路線列表
      const response = await apiClient.get(`/routes?page=${currentPage}&limit=${rowsPerPage}&search=${searchTerm}`);
      if (response.data.success) {
        setRoutes(response.data.routes || []);
        setTotalItems(response.data.total || 0);
      }
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} route:`, error);
    }
  };

  // 計算總頁數
  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // 根據搜索條件過濾路線
  let displayedRoutes = routes;
  if (searchTerm) {
    displayedRoutes = routes.filter(route => 
      route.routeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isAdmin={isAdmin} /> {/* Pass isAdmin prop */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">路線綁定</h1>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            {/* 路線綁定內容 */}
            <div className="flex justify-between items-center mb-4 gap-4">
              <div className="relative flex-grow max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </span>
                <input 
                  type="text" 
                  placeholder="搜尋路線名稱" 
                  value={searchTerm} 
                  onChange={handleSearchChange} 
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button 
                onClick={handleOpenCreateModal} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                新增路線
              </button>
            </div>

            {/* 路線表格 */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">路線名稱</th>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">綁定表單</th>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={3} className="px-6 py-12 text-center">載入中...</td></tr>
                  ) : displayedRoutes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FaRegFolderOpen className="text-4xl mb-2" />
                          <span>無資料...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedRoutes.map((route) => {
                      // 這裡假設每個路由都有 RouteId 和 RouteName 屬性
                      return (
                        <tr key={route.RouteId}>
                          <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                            {route.RouteName}
                          </td>
                          <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                            {route.BindingTableName ? route.BindingTableName : "未綁定表單"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-3">
                              <button 
                                onClick={() => handleEditRoute(route)} 
                                className="text-blue-600 hover:text-blue-800"
                                title="編輯"
                              >
                                <FaPencilAlt />
                              </button>
                              <button 
                                onClick={() => handleDeleteRoute(route)} 
                                className="text-red-600 hover:text-red-800"
                                title="刪除"
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* 分頁控制 */}
            {!loading && displayedRoutes.length > 0 && (
              <div className="flex justify-end items-center mt-4">
                <div className="flex items-center space-x-2">
                  <select 
                    value={rowsPerPage} 
                    onChange={handleRowsPerPageChange} 
                    className="border border-gray-300 rounded p-2"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <span className="text-gray-500 dark:text-gray-400">
                    頁面 {currentPage} / {totalPages}
                  </span>
                  <button 
                    onClick={handlePreviousPage} 
                    disabled={currentPage === 1} 
                    className="px-3 py-1 border border-gray-300 rounded bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  >
                    上一頁
                  </button>
                  <button 
                    onClick={handleNextPage} 
                    disabled={currentPage === totalPages} 
                    className="px-3 py-1 border border-gray-300 rounded bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 新增/編輯路線模態框 */}
      <CreateRouteModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleRouteSubmit}
        availableForms={availableForms}
        isEditing={!!editingRoute}
        editData={editingRoute}
      />

      {/* 刪除確認模態框 */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="確認刪除路線"
        message={routeToDelete ? `確定要刪除路線「${routeToDelete.routeName}」嗎？` : "確定要刪除這個路線嗎？"}
        confirmText="刪除"
        cancelText="取消"
        theme="delete" 
      />
    </div>
  );
}

export default RouteBinding;
