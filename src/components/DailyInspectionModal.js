import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import dailyInspectionService from '../services/dailyInspectionService';

// 設置 Modal 的 app element
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

const DailyInspectionModal = ({ isOpen, onClose, onSuccess }) => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoutes, setSelectedRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [uninspectedDate, setUninspectedDate] = useState(
    dailyInspectionService.getTodayDateString()
  );

  useEffect(() => {
    if (isOpen) {
      loadRoutes();
      // 重置狀態
      setSelectedRoutes([]);
      setError(null);
      setUninspectedDate(dailyInspectionService.getTodayDateString());
    }
  }, [isOpen]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dailyInspectionService.getDailyInspectionRoutes();
      
      if (response.success) {
        setRoutes(response.routes || []);
      } else {
        setError('載入日檢路線失敗');
      }
    } catch (err) {
      console.error('Error loading daily inspection routes:', err);
      setError('載入日檢路線時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteToggle = (route) => {
    const routeKey = `${route.tableId}-${route.routeId}`;
    const routeData = {
      table_id: route.tableId,
      route_id: route.routeId
    };

    setSelectedRoutes(prevSelected => {
      const isCurrentlySelected = prevSelected.some(
        selected => selected.table_id === route.tableId && selected.route_id === route.routeId
      );

      if (isCurrentlySelected) {
        return prevSelected.filter(
          selected => !(selected.table_id === route.tableId && selected.route_id === route.routeId)
        );
      } else {
        return [...prevSelected, routeData];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedRoutes.length === routes.length) {
      // 全部取消選擇
      setSelectedRoutes([]);
    } else {
      // 全部選擇
      const allRoutes = routes.map(route => ({
        table_id: route.tableId,
        route_id: route.routeId
      }));
      setSelectedRoutes(allRoutes);
    }
  };

  const handleSubmit = async () => {
    if (selectedRoutes.length === 0) {
      setError('請至少選擇一個路線');
      return;
    }

    if (!dailyInspectionService.validateSelectedRoutes(selectedRoutes)) {
      setError('選擇的路線資料無效');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await dailyInspectionService.skipDailyInspections(
        selectedRoutes,
        uninspectedDate
      );

      if (response.success) {
        // 成功處理
        if (onSuccess) {
          onSuccess(response);
        }
        onClose();
      } else {
        // 部分成功或失敗
        let errorMessage = `處理完成：${response.success_count} 成功，${response.error_count} 失敗`;
        if (response.errors && response.errors.length > 0) {
          errorMessage += '\n錯誤詳情：\n' + response.errors.join('\n');
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error submitting daily inspection skip:', err);
      setError('提交時發生錯誤，請稍後重試');
    } finally {
      setSubmitting(false);
    }
  };

  const isRouteSelected = (route) => {
    return selectedRoutes.some(
      selected => selected.table_id === route.tableId && selected.route_id === route.routeId
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="日檢路線選擇"
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">日檢路線選擇</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={submitting}
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-96">
          {/* 日期選擇 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              未使用日期
            </label>
            <input
              type="date"
              value={uninspectedDate}
              onChange={(e) => setUninspectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
              readOnly
            />
          </div>

          {/* 錯誤信息 */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
              {error}
            </div>
          )}

          {/* 載入狀態 */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">載入中...</div>
            </div>
          ) : (
            <>
              {/* 全選按鈕 */}
              {routes.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={handleSelectAll}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                    disabled={submitting}
                  >
                    {selectedRoutes.length === routes.length ? '取消全選' : '全選'}
                  </button>
                  <span className="ml-3 text-sm text-gray-600">
                    已選擇 {selectedRoutes.length} / {routes.length} 個路線
                  </span>
                </div>
              )}

              {/* 路線列表 */}
              {routes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  沒有找到含有"每日作業前"的路線
                </div>
              ) : (
                <div className="space-y-2">
                  {routes.map((route, index) => (
                    <div
                      key={`${route.tableId}-${route.routeId}`}
                      className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`route-${index}`}
                        checked={isRouteSelected(route)}
                        onChange={() => handleRouteToggle(route)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        disabled={submitting}
                      />
                      <label
                        htmlFor={`route-${index}`}
                        className="ml-3 flex-1 cursor-pointer"
                      >
                        <div className="text-sm font-medium text-gray-800">
                          {dailyInspectionService.formatRouteDisplayName(route)}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            disabled={submitting}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={submitting || selectedRoutes.length === 0}
          >
            {submitting ? '處理中...' : `送出 (${selectedRoutes.length})`}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DailyInspectionModal;