import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import followupService from '../services/followupService';

const FollowupManagement = () => {
  const { user } = useContext(AuthContext);
  const [followupRecords, setFollowupRecords] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'open', 'closed'
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingDetails, setEditingDetails] = useState(null);

  useEffect(() => {
    loadFollowupData();
  }, [filter]);

  const loadFollowupData = async () => {
    try {
      setLoading(true);
      setError(null);

      let records = [];
      if (filter === 'open') {
        const response = await followupService.getOpenFollowupCases();
        records = response.records || [];
      } else {
        // 對於 'all' 和 'closed'，我們需要從不同的表獲取數據
        // 這裡可能需要調整 API 來支持這種過濾
        const response = await followupService.getOpenFollowupCases();
        records = response.records || [];
      }

      const formattedRecords = records.map(followupService.formatFollowupRecord);
      setFollowupRecords(formattedRecords);

      // 加載統計信息
      if (followupService.canManageFollowupCases(user)) {
        const statsResponse = await followupService.getFollowupStatistics();
        setStatistics(statsResponse);
      }

    } catch (err) {
      console.error('Error loading followup data:', err);
      setError('載入後續追蹤資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDetails = async (followupId, newDetails) => {
    try {
      await followupService.updateFollowupRecord(followupId, newDetails);
      setEditingDetails(null);
      loadFollowupData(); // 重新加載資料
    } catch (err) {
      console.error('Error updating followup details:', err);
      setError('更新處理詳情失敗');
    }
  };

  const handleCloseCase = async (followupId) => {
    if (!window.confirm('確定要結案此後續追蹤記錄嗎？')) {
      return;
    }

    try {
      await followupService.closeFollowupCase(followupId);
      loadFollowupData(); // 重新加載資料
    } catch (err) {
      console.error('Error closing case:', err);
      setError('結案失敗');
    }
  };

  const renderProcessingDetails = (details, followupId, isClosed) => {
    if (!details || !Array.isArray(details)) {
      return <div className="text-gray-500">無處理詳情</div>;
    }

    const isEditing = editingDetails === followupId;

    return (
      <div className="space-y-2">
        {details.map((item, index) => (
          <div key={index} className="border rounded p-3 bg-gray-50">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">項目 {item.itemId}:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  item.inspectionResult === '異常' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {item.inspectionResult}
                </span>
              </div>
              <div>
                <span className="font-medium">處理結果:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={item.processingResult || ''}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].processingResult = e.target.value;
                      setEditingDetails({ id: followupId, details: newDetails });
                    }}
                    className="ml-2 px-2 py-1 border rounded text-xs"
                    placeholder="輸入處理結果"
                  />
                ) : (
                  <span className="ml-2">{item.processingResult || '未處理'}</span>
                )}
              </div>
              <div>
                <span className="font-medium">預定完成日:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={item.scheduledCompletionDate || ''}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].scheduledCompletionDate = e.target.value;
                      setEditingDetails({ id: followupId, details: newDetails });
                    }}
                    className="ml-2 px-2 py-1 border rounded text-xs"
                  />
                ) : (
                  <span className="ml-2">{item.scheduledCompletionDate || '未設定'}</span>
                )}
              </div>
              <div>
                <span className="font-medium">實際完成日:</span>
                {isEditing ? (
                  <input
                    type="date"
                    value={item.actualCompletionDate || ''}
                    onChange={(e) => {
                      const newDetails = [...details];
                      newDetails[index].actualCompletionDate = e.target.value;
                      setEditingDetails({ id: followupId, details: newDetails });
                    }}
                    className="ml-2 px-2 py-1 border rounded text-xs"
                  />
                ) : (
                  <span className="ml-2">{item.actualCompletionDate || '未完成'}</span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {!isClosed && (
          <div className="flex gap-2 mt-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => handleUpdateDetails(followupId, editingDetails.details)}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => setEditingDetails(null)}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingDetails({ id: followupId, details: [...details] })}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                編輯
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!followupService.canManageFollowupCases(user)) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500">您沒有權限查看後續追蹤管理</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">巡檢異常後續追蹤管理</h1>
        
        {/* 統計信息 */}
        {statistics.overall_statistics && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-800">
                {statistics.overall_statistics.total_cases || 0}
              </div>
              <div className="text-blue-600">總案件數</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-800">
                {statistics.overall_statistics.open_cases || 0}
              </div>
              <div className="text-yellow-600">未結案</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-800">
                {statistics.overall_statistics.closed_cases || 0}
              </div>
              <div className="text-green-600">已結案</div>
            </div>
            <div className="bg-purple-100 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-800">
                {statistics.overall_statistics.affected_tables || 0}
              </div>
              <div className="text-purple-600">涉及表格</div>
            </div>
          </div>
        )}

        {/* 過濾器 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            全部案件
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-4 py-2 rounded ${
              filter === 'open' 
                ? 'bg-yellow-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            未結案
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={`px-4 py-2 rounded ${
              filter === 'closed' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            已結案
          </button>
        </div>
      </div>

      {/* 錯誤信息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* 載入狀態 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-gray-500">載入中...</div>
        </div>
      ) : (
        /* 後續追蹤記錄列表 */
        <div className="space-y-4">
          {followupRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              沒有找到後續追蹤記錄
            </div>
          ) : (
            followupRecords.map((record) => (
              <div key={record.FollowUpID} className="bg-white border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      案件 #{record.FollowUpID}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>來源表格: {record.SourceTableName}</div>
                      <div>記錄 ID: {record.SourceRecordID}</div>
                      <div>建立時間: {record.processingTimestamp}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      record.isClosed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.isClosed ? '已結案' : '未結案'}
                    </span>
                    {!record.isClosed && (
                      <button
                        onClick={() => handleCloseCase(record.FollowUpID)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        結案
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">處理詳情:</h4>
                  {renderProcessingDetails(
                    record.processingDetails, 
                    record.FollowUpID, 
                    record.isClosed
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default FollowupManagement;