/**
 * 日檢相關的 API 服務
 * 處理每日作業前的巡檢路線管理
 */

import { apiClient } from './authService';

/**
 * 獲取含有"每日作業前"的自動派工檔路線記錄
 * @returns {Promise<Object>} API 響應
 */
export const getDailyInspectionRoutes = async () => {
  try {
    const response = await apiClient.get('/daily-inspection/routes');
    return response.data;
  } catch (error) {
    console.error('Error fetching daily inspection routes:', error);
    throw error;
  }
};

/**
 * 處理日檢跳過操作
 * @param {Array} selectedRoutes - 選中的路線陣列
 * @param {string} uninspectedDate - 未巡檢日期 (YYYY-MM-DD)，可選
 * @returns {Promise<Object>} API 響應
 */
export const skipDailyInspections = async (selectedRoutes, uninspectedDate = null) => {
  try {
    const requestData = {
      selected_routes: selectedRoutes
    };
    
    if (uninspectedDate) {
      requestData.uninspected_date = uninspectedDate;
    }
    
    const response = await apiClient.post('/daily-inspection/skip', requestData);
    return response.data;
  } catch (error) {
    console.error('Error skipping daily inspections:', error);
    throw error;
  }
};

/**
 * 獲取未完成的路線記錄
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)，可選
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)，可選
 * @returns {Promise<Object>} API 響應
 */
export const getUnusedRouteRecords = async (startDate = null, endDate = null) => {
  try {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await apiClient.get('/daily-inspection/unused-records', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching unused route records:', error);
    throw error;
  }
};

/**
 * 刪除未完成路線記錄
 * @param {number} recordId - 記錄 ID
 * @returns {Promise<Object>} API 響應
 */
export const deleteUnusedRouteRecord = async (recordId) => {
  try {
    const response = await apiClient.delete(`/daily-inspection/unused-records/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting unused route record:', error);
    throw error;
  }
};

/**
 * 獲取日檢統計信息
 * @returns {Promise<Object>} API 響應
 */
export const getDailyInspectionStatistics = async () => {
  try {
    const response = await apiClient.get('/daily-inspection/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching daily inspection statistics:', error);
    throw error;
  }
};

/**
 * 格式化路線顯示名稱
 * @param {Object} route - 路線物件
 * @returns {string} 格式化的顯示名稱
 */
export const formatRouteDisplayName = (route) => {
  const displayName = route.displayName || '未知表格';
  const routeName = route.routeName || '未知路線';
  return `${displayName} - ${routeName}`;
};

/**
 * 驗證選擇的路線資料
 * @param {Array} selectedRoutes - 選中的路線陣列
 * @returns {boolean} 是否有效
 */
export const validateSelectedRoutes = (selectedRoutes) => {
  if (!Array.isArray(selectedRoutes) || selectedRoutes.length === 0) {
    return false;
  }
  
  return selectedRoutes.every(route => 
    route && 
    typeof route === 'object' && 
    'table_id' in route && 
    'route_id' in route &&
    Number.isInteger(route.table_id) &&
    Number.isInteger(route.route_id)
  );
};

/**
 * 格式化日期為 YYYY-MM-DD 格式
 * @param {Date} date - 日期物件
 * @returns {string} 格式化的日期字符串
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  if (typeof date === 'string') {
    return date;
  }
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
};

/**
 * 獲取今天的日期字符串 (YYYY-MM-DD)
 * @returns {string} 今天的日期
 */
export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export default {
  getDailyInspectionRoutes,
  skipDailyInspections,
  getUnusedRouteRecords,
  deleteUnusedRouteRecord,
  getDailyInspectionStatistics,
  formatRouteDisplayName,
  validateSelectedRoutes,
  formatDateForAPI,
  getTodayDateString
};