/**
 * InspectionFollowUp 相關的 API 服務
 * 處理巡檢異常結果的後續追蹤與處理
 */

import api from './authService';

/**
 * 創建巡檢後續追蹤記錄
 * @param {Object} followupData - 後續追蹤記錄資料
 * @returns {Promise<Object>} API 響應
 */
export const createFollowupRecord = async (followupData) => {
  try {
    const response = await api.post('/api/followup', followupData);
    return response.data;
  } catch (error) {
    console.error('Error creating followup record:', error);
    throw error;
  }
};

/**
 * 獲取指定來源表的後續追蹤記錄
 * @param {string} sourceTableName - 來源表名
 * @param {number} sourceRecordId - 可選，指定記錄 ID
 * @returns {Promise<Object>} API 響應
 */
export const getFollowupRecords = async (sourceTableName, sourceRecordId = null) => {
  try {
    const params = sourceRecordId ? { source_record_id: sourceRecordId } : {};
    const response = await api.get(`/api/followup/${sourceTableName}`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching followup records:', error);
    throw error;
  }
};

/**
 * 更新後續追蹤記錄的處理詳情
 * @param {number} followupId - 後續處理紀錄 ID
 * @param {Array} processingDetails - 處理詳情陣列
 * @returns {Promise<Object>} API 響應
 */
export const updateFollowupRecord = async (followupId, processingDetails) => {
  try {
    const response = await api.put(`/api/followup/${followupId}`, {
      processing_details: JSON.stringify(processingDetails)
    });
    return response.data;
  } catch (error) {
    console.error('Error updating followup record:', error);
    throw error;
  }
};

/**
 * 結案後續追蹤記錄
 * @param {number} followupId - 後續處理紀錄 ID
 * @returns {Promise<Object>} API 響應
 */
export const closeFollowupCase = async (followupId) => {
  try {
    const response = await api.post(`/api/followup/${followupId}/close`);
    return response.data;
  } catch (error) {
    console.error('Error closing followup case:', error);
    throw error;
  }
};

/**
 * 獲取所有未結案的後續追蹤記錄
 * @returns {Promise<Object>} API 響應
 */
export const getOpenFollowupCases = async () => {
  try {
    const response = await api.get('/api/followup/open-cases');
    return response.data;
  } catch (error) {
    console.error('Error fetching open followup cases:', error);
    throw error;
  }
};

/**
 * 獲取後續追蹤記錄統計信息
 * @returns {Promise<Object>} API 響應
 */
export const getFollowupStatistics = async () => {
  try {
    const response = await api.get('/api/followup/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching followup statistics:', error);
    throw error;
  }
};

/**
 * 檢查巡檢資料中是否有異常結果
 * @param {Object} inspectionData - 巡檢資料
 * @returns {boolean} 是否有異常結果
 */
export const hasAbnormalResults = (inspectionData) => {
  for (const [key, value] of Object.entries(inspectionData)) {
    if (key.startsWith('Item') && !key.includes('_Remark') && value === '異常') {
      return true;
    }
  }
  return false;
};

/**
 * 從巡檢資料中提取異常項目
 * @param {Object} inspectionData - 巡檢資料
 * @returns {Array} 異常項目陣列
 */
export const extractAbnormalItems = (inspectionData) => {
  const abnormalItems = [];
  
  for (const [key, value] of Object.entries(inspectionData)) {
    if (key.startsWith('Item') && !key.includes('_Remark') && value === '異常') {
      const itemId = key.replace('Item', '');
      abnormalItems.push({
        itemId: parseInt(itemId),
        inspectionResult: value,
        processingResult: '',
        scheduledCompletionDate: '',
        actualCompletionDate: ''
      });
    }
  }
  
  return abnormalItems;
};

/**
 * 格式化後續追蹤記錄以供顯示
 * @param {Object} followupRecord - 後續追蹤記錄
 * @returns {Object} 格式化後的記錄
 */
export const formatFollowupRecord = (followupRecord) => {
  return {
    ...followupRecord,
    processingDetails: typeof followupRecord.ProcessingDetails === 'string'
      ? JSON.parse(followupRecord.ProcessingDetails)
      : followupRecord.ProcessingDetails,
    processingTimestamp: new Date(followupRecord.ProcessingTimestamp).toLocaleString('zh-TW'),
    isClosed: Boolean(followupRecord.IsClosed)
  };
};

/**
 * 檢查用戶是否有權限管理後續追蹤案件
 * @param {Object} user - 用戶物件
 * @returns {boolean} 是否有權限
 */
export const canManageFollowupCases = (user) => {
  return user && user.PriorityLevel >= 2;
};

export default {
  createFollowupRecord,
  getFollowupRecords,
  updateFollowupRecord,
  closeFollowupCase,
  getOpenFollowupCases,
  getFollowupStatistics,
  hasAbnormalResults,
  extractAbnormalItems,
  formatFollowupRecord,
  canManageFollowupCases
};