import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { getPendingApprovalRecords, approveInspectionRecord, bulkApproveRecordsByIds } from '../services/authService.js';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import InspectionModal from '../components/InspectionModal.js';

function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [pendingRecords, setPendingRecords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // 獲取待核簽記錄
  const fetchPendingRecords = async () => {
    if (!user || !user.department) {
      setError('無法獲取用戶部門信息');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 從用戶部門信息中提取3位部門代號
      // 假設部門格式為 "XXX部門" 或者直接是3位數字
      let departmentCode = user.department;
      
      // 如果部門是中文名稱，嘗試提取前3個字符作為代號
      if (departmentCode && departmentCode.length > 3) {
        // 嘗試從部門名稱中提取數字
        const match = departmentCode.match(/(\d{3})/);
        if (match) {
          departmentCode = match[1];
        } else {
          // 如果沒有找到3位數字，使用前3個字符
          departmentCode = departmentCode.substring(0, 3);
        }
      }

      console.log('使用部門代號:', departmentCode);
      const data = await getPendingApprovalRecords(departmentCode);
      setPendingRecords(data);
    } catch (err) {
      console.error('獲取待核簽記錄失敗:', err);
      setError(err.message || '獲取待核簽記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  // 打開巡檢詳情modal
  const handleOpenModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  // 關閉modal
  const handleCloseModal = () => {
    setSelectedRecord(null);
    setIsModalOpen(false);
  };

  // 核簽單筆記錄
  const handleApproveRecord = async (record, comment, reviewerId) => {
    try {
      // 智能查找 ID 欄位 - 查找包含表名和 "Id" 的欄位
      const availableFields = Object.keys(record);
      const tableName = record.TableName.trim();
      
      console.log('Record data:', record);
      console.log('Table name:', tableName);
      console.log('Available fields:', availableFields);
      
      let recordId = null;
      let actualIdField = null;
      
      // 先嘗試查找正確的欄位名稱格式
      const expectedIdField = `${tableName}Id`;
      const actualIdField2 = `user_${tableName}Id`; // 實際可能是這種格式
      
      // 按優先順序查找 ID 欄位
      const possibleIdFields = [
        expectedIdField,           // user_B20D561014Id
        actualIdField2,            // user_user_B20D561014Id
        `user_${expectedIdField}` // 另一種可能的格式
      ];
      
      for (const fieldName of possibleIdFields) {
        if (record[fieldName] !== undefined && record[fieldName] !== null) {
          recordId = record[fieldName];
          console.log(`Found ID field: "${fieldName}" with value: ${recordId}`);
          break;
        }
      }
      
      // 如果還是找不到，使用通用查找
      if (recordId === null) {
        for (const fieldName of availableFields) {
          // 檢查欄位名稱是否包含表名和 Id
          const fieldNameLower = fieldName.toLowerCase().replace(/\s+/g, '');
          const tableNameLower = tableName.toLowerCase().replace(/\s+/g, '');
          
          if (fieldNameLower.includes(tableNameLower) && fieldNameLower.includes('id')) {
            recordId = record[fieldName];
            actualIdField = fieldName;
            console.log(`Found ID field: "${fieldName}" with value: ${recordId}`);
            break;
          }
        }
      }
      
      if (!recordId) {
        // 如果還是找不到，顯示所有欄位供用戶選擇
        const fieldList = availableFields.map(field => `"${field}": ${record[field]}`).join('\n');
        alert(`無法找到記錄 ID 欄位。\n表名: ${tableName}\n可用欄位:\n${fieldList}`);
        return;
      }
      
      const approvalData = {
        table_name: record.TableName,
        record_id: recordId,
        reviewer_comment: comment
      };

      await approveInspectionRecord(approvalData);
      
      // 刷新待核簽記錄
      await fetchPendingRecords();
      
      alert('核簽成功！');
    } catch (error) {
      console.error('核簽失敗:', error);
      throw error;
    }
  };

  // 批量核簽正常表單
  const handleBulkApprove = async () => {
    if (!user || !user.department) {
      alert('無法獲取用戶部門信息');
      return;
    }

    if (!pendingRecords || !pendingRecords.正常表單內容 || pendingRecords.正常表單內容.length === 0) {
      alert('沒有正常表單需要核簽');
      return;
    }

    const confirmMessage = `確定要批量核簽 ${pendingRecords.正常表單內容.length} 筆正常表單嗎？`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsBulkApproving(true);
    try {
      // 直接批量核簽當前顯示的正常表單記錄
      const normalRecords = pendingRecords.正常表單內容;
      
      // 準備批量核簽數據
      const bulkApprovalData = {
        records: normalRecords.map(record => {
          // 智能查找 ID 欄位
          const availableFields = Object.keys(record);
          const tableName = record.TableName.trim();
          
          let recordId = null;
          // 先嘗試查找正確的欄位名稱格式
          const expectedIdField = `${tableName}Id`;
          const actualIdField = `user_${tableName}Id`; // 實際可能是這種格式
          
          // 按優先順序查找 ID 欄位
          const possibleIdFields = [
            expectedIdField,           // user_B20D561014Id
            actualIdField,            // user_user_B20D561014Id
            `user_${expectedIdField}` // 另一種可能的格式
          ];
          
          for (const fieldName of possibleIdFields) {
            if (record[fieldName] !== undefined && record[fieldName] !== null) {
              recordId = record[fieldName];
              break;
            }
          }
          
          // 如果還是找不到，使用通用查找
          if (recordId === null) {
            for (const fieldName of availableFields) {
              const fieldNameLower = fieldName.toLowerCase().replace(/\s+/g, '');
              const tableNameLower = tableName.toLowerCase().replace(/\s+/g, '');
              
              if (fieldNameLower.includes(tableNameLower) && fieldNameLower.includes('id')) {
                recordId = record[fieldName];
                break;
              }
            }
          }
          
          return {
            table_name: record.TableName,
            record_id: recordId
          };
        }).filter(item => item.record_id !== null), // 只保留找到 ID 的記錄
        reviewer_comment: '批量核簽 - 正常表單'
      };

      await bulkApproveRecordsByIds(bulkApprovalData);
      
      // 刷新待核簽記錄
      await fetchPendingRecords();
      
      alert('批量核簽成功！');
    } catch (error) {
      console.error('批量核簽失敗:', error);
      alert('批量核簽失敗，請稍後再試');
    } finally {
      setIsBulkApproving(false);
    }
  };

  useEffect(() => {
    console.log('進入dashboard頁面');
    
    // 检查用户是否已登录
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // 僅當 user 存在且有 department 時才獲取待核簽記錄
    if (user && user.department) {
      fetchPendingRecords();
    }
    
  }, [navigate, user, isLoggedIn]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900" onLoad={() => console.log('進入dashboard頁面')}>
      <Sidebar />

      <div className="flex-1 p-8 text-gray-900 dark:text-gray-100">
        <div className="flex justify-end mb-4">
          <LogoutButton />
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">巡檢作業核簽與紀錄</h1>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              📋 核簽與紀錄功能
            </h2>
            <p className="text-blue-700 dark:text-blue-300">
              在此頁面您可以進行巡檢結果的核簽作業以及查看相關紀錄。左側為待核簽的紀錄列表，右側為已完成的巡檢結果查看。
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側：待核簽紀錄 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">待核簽紀錄</h2>
              </div>
              <button
                onClick={fetchPendingRecords}
                disabled={loading}
                className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition flex items-center space-x-1"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{loading ? '載入中' : '刷新'}</span>
              </button>
            </div>
            
            {/* 待核簽記錄內容 */}
            {loading ? (
              // 載入狀態
              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border animate-pulse">
                    <div className="flex justify-between items-start mb-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              // 錯誤狀態
              <div className="text-center py-8 text-red-500 dark:text-red-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm mb-2">載入失敗</p>
                <p className="text-xs">{error}</p>
                <button 
                  onClick={fetchPendingRecords}
                  className="mt-3 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                >
                  重新載入
                </button>
              </div>
            ) : pendingRecords ? (
              // 有數據狀態
              <div className="space-y-4">
                {/* 統計信息 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      正常表單: <span className="font-semibold">{pendingRecords.巡檢正常表單的數量}</span>
                    </span>
                    <span className="text-orange-600 dark:text-orange-400">
                      異常表單: <span className="font-semibold">{pendingRecords.巡檢有非正常的數量}</span>
                    </span>
                  </div>
                </div>

                {/* 異常表單 - 優先顯示 */}
                {pendingRecords.非正常表單內容 && pendingRecords.非正常表單內容.length > 0 && (
                  <>
                    <div className="text-sm font-semibold text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-800 pb-1">
                      ⚠️ 異常表單 ({pendingRecords.非正常表單內容.length})
                    </div>
                    {pendingRecords.非正常表單內容.map((record, index) => (
                      <div key={`abnormal-${index}`} className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                              {record.DisplayName || record.TableName || '未知表單'}
                            </h3>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {record.RouteName || `路線${record.RouteId || '未知'}`}
                            </span>
                          </div>
                          <span className="text-xs bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded">異常</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          巡檢時間：{record.CheckDate ? new Date(record.CheckDate).toLocaleString() : '未知'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          巡檢人員：{record.UserName || '未知'}
                        </p>
                        <button 
                          onClick={() => handleOpenModal(record)}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                        >
                          查看詳情
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* 正常表單 */}
                {pendingRecords.正常表單內容 && pendingRecords.正常表單內容.length > 0 && (
                  <>
                    <div className="flex justify-between items-center border-b border-green-200 dark:border-green-800 pb-2 mb-3">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ✅ 正常表單 ({pendingRecords.正常表單內容.length})
                      </div>
                      <button
                        onClick={handleBulkApprove}
                        disabled={isBulkApproving}
                        className="text-sm bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded transition flex items-center space-x-1"
                      >
                        {isBulkApproving && (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        )}
                        <span>{isBulkApproving ? '核簽中...' : '一鍵核簽'}</span>
                      </button>
                    </div>
                    {pendingRecords.正常表單內容.map((record, index) => (
                      <div key={`normal-${index}`} className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                              {record.DisplayName || record.TableName || '未知表單'}
                            </h3>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {record.RouteName || `路線${record.RouteId || '未知'}`}
                            </span>
                          </div>
                          <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">待核簽</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          巡檢時間：{record.CheckDate ? new Date(record.CheckDate).toLocaleString() : '未知'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          巡檢人員：{record.UserName || '未知'}
                        </p>
                        <button 
                          onClick={() => handleOpenModal(record)}
                          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                        >
                          查看詳情
                        </button>
                      </div>
                    ))}
                  </>
                )}

                {/* 空狀態 */}
                {(!pendingRecords.正常表單內容 || pendingRecords.正常表單內容.length === 0) && 
                 (!pendingRecords.非正常表單內容 || pendingRecords.非正常表單內容.length === 0) && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">沒有待核簽紀錄</p>
                  </div>
                )}
              </div>
            ) : (
              // 初始狀態
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">載入中...</p>
              </div>
            )}
          </div>

          {/* 右側：巡檢結果 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">巡檢結果</h2>
            </div>
            
            <div className="space-y-4">
              {/* 已完成巡檢結果範例 */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線A - 週檢</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">已完成</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">完成時間：2024-01-14 16:45</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">核簽人員：王五</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">結果：正常</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看報告
                </button>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">聚酯膜生產線C - 安全檢查</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded">已完成</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">完成時間：2024-01-14 14:20</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">核簽人員：趙六</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">結果：正常</p>
                <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition">
                  查看報告
                </button>
              </div>

              {/* 查看更多按鈕 */}
              <div className="text-center">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  查看更多結果 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* InspectionModal */}
      <InspectionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        record={selectedRecord}
        onApprove={handleApproveRecord}
      />
    </div>
  );
}

export default Dashboard;
