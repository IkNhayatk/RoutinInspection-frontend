import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { submitInspectionData } from '../services/authService.js';

// Enhanced mobile and tablet optimization styles
const injectCustomStyles = () => {
  if (typeof document !== 'undefined' && !document.getElementById('inspection-tablet-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'inspection-tablet-styles';
    styleElement.textContent = `
      @keyframes slideInFromBottom {
        0% {
          opacity: 0;
          transform: translateY(50px) scale(0.95);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes fadeInScale {
        0% {
          opacity: 0;
          transform: scale(0.9);
        }
        100% {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .animate-in {
        animation: fadeInScale 0.4s ease-out forwards;
      }
      
      .slide-in-from-bottom-4 {
        animation: slideInFromBottom 0.6s ease-out forwards;
        opacity: 0;
      }
      
      /* Mobile optimization */
      @media (max-width: 768px) {
        .mobile-optimized input,
        .mobile-optimized select,
        .mobile-optimized textarea {
          font-size: 16px !important; /* Prevents zoom on iOS */
          padding: 1rem !important;
        }
        
        .mobile-optimized button {
          min-height: 48px;
          min-width: 48px;
          padding: 0.75rem 1.5rem;
        }
        
        .mobile-card {
          margin: 0.5rem;
          border-radius: 1rem;
        }
        
        .mobile-header {
          padding: 1rem;
          position: sticky;
          top: 0;
          z-index: 50;
        }
      }
      
      /* Touch-friendly interactions */
      @media (hover: none) and (pointer: coarse) {
        .hover\\:scale-105:hover {
          transform: scale(1.02);
        }
        
        .hover\\:shadow-xl:hover {
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        }
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Enhanced focus states */
      .focus-ring:focus-visible {
        outline: 3px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Custom scrollbar for webkit browsers */
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(styleElement);
  }
};

// Form component for rendering schema content
const FormRenderer = ({ schemaContent, formData, onFormDataChange }) => {
  const [validationErrors, setValidationErrors] = useState({});

  // Parse schema content if it's a string
  const parseSchema = (content) => {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch (error) {
      console.error('Error parsing schema content:', error);
      return null;
    }
  };

  const schema = parseSchema(schemaContent);

  // Render individual form item
  const renderFormItem = (item, fullPath = '') => {
    const fieldKey = `Item${item.ItemId}`;
    const hasError = validationErrors[fieldKey];
    
    return (
      <div key={item.ItemId} className={`bg-gray-50 dark:bg-gray-700/50 border-l-4 border-blue-400 rounded-r-lg p-4 ml-4 transition-all duration-200 ${
        hasError ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' : ''
      }`}>
        <div className="space-y-3">
     
          {/* Main input field */}
          <div>
            <label className="flex items-center text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              檢查結果 <span className="text-red-500 ml-1">*</span>
            </label>
            {item.Type && item.Type.includes('[s]') ? (
              <select
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(item.ItemId, '', e.target.value)}
                className={`w-full p-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 dark:bg-gray-600 dark:text-white ${
                  hasError 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 dark:border-gray-500 hover:border-blue-300'
                }`}
              >
                <option value="">請選擇檢查結果...</option>
                {item.Type.replace('[s]', '').split(',').map((option, idx) => (
                  <option key={idx} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={formData[fieldKey] || ''}
                onChange={(e) => handleInputChange(item.ItemId, '', e.target.value)}
                className={`w-full p-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 dark:bg-gray-600 dark:border-gray-500 dark:text-white ${
                  hasError 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                placeholder="請輸入檢查結果"
              />
            )}
            {hasError && (
              <div className="flex items-center mt-2 text-red-600 dark:text-red-400">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{hasError}</span>
              </div>
            )}
          </div>
          
          {/* Remark field */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              備註說明
            </label>
            <textarea
              value={formData[`${fieldKey}_Remark`] || ''}
              onChange={(e) => handleInputChange(item.ItemId, 'Remark', e.target.value)}
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 dark:bg-gray-600 dark:text-white hover:border-blue-300 resize-none"
              rows="2"
              placeholder="請填寫檢查備註或異常說明..."
            />
          </div>
        </div>
      </div>
    );
  };

  // Render elements recursively with proper hierarchy
  const renderElements = (elements, parentPath = '', level = 0) => {
    if (!elements || !Array.isArray(elements)) return null;

    return elements
      .sort((a, b) => (a.DisplayOrder || 0) - (b.DisplayOrder || 0))
      .map((element, index) => {
        if (element.ElmentType === 'Item' && element.ItemId) {
          return renderFormItem(element, parentPath);
        }

        if (element.ElmentType === 'Div' && element.Elements) {
          const currentPath = parentPath ? `${parentPath} > ${element.Name || ''}` : element.Name || '';

          return (
            <div key={`div-${level}-${index}`} className="mb-6">
              {/* Section Header */}
              {element.Name && (
                <div className={`mb-4 ${level === 0 ? 'bg-gradient-to-r from-blue-600 to-blue-700' : level === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-blue-400 to-blue-500'} text-white p-4 rounded-lg shadow-md`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-8 bg-white/30 rounded-full`}></div>
                    <h3 className={`font-bold ${level === 0 ? 'text-xl' : level === 1 ? 'text-lg' : 'text-base'}`}>
                      {element.Name}
                    </h3>
                  </div>
                </div>
              )}
              
              {/* Section Content */}
              <div className={level > 0 ? 'ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-4' : ''}>
                {renderElements(element.Elements, currentPath, level + 1)}
              </div>
            </div>
          );
        }

        return null;
      });
  };

  const handleInputChange = (itemId, field, value) => {
    const fieldKey = `Item${itemId}${field ? `_${field}` : ''}`;
    const newFormData = {
      ...formData,
      [fieldKey]: value
    };
    onFormDataChange(newFormData);
    
    // Clear validation error when user starts typing
    if (validationErrors[fieldKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };


  if (!schema) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">無法解析表單架構</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderElements(schema.Elements)}
    </div>
  );
};

// Collapsible inspection card component
const InspectionCard = ({ inspection, isSelected, onSelectionChange, onAutoFill, initialFormData, onFormDataChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState(initialFormData || {});

  // Notify parent component when form data changes
  const handleFormDataChange = useCallback((newFormData) => {
    setFormData(newFormData);
    if (onFormDataChange) {
      onFormDataChange(inspection.routeId, newFormData);
    }
  }, [inspection.routeId, onFormDataChange]);

  // Update form data when initialFormData changes
  useEffect(() => {
    if (initialFormData && Object.keys(initialFormData).length > 0) {
      setFormData(initialFormData);
    }
  }, [initialFormData]);
  
  // Auto-fill functionality
  const handleAutoFill = () => {
    const parseSchema = (content) => {
      try {
        return typeof content === 'string' ? JSON.parse(content) : content;
      } catch (error) {
        console.error('Error parsing schema content:', error);
        return null;
      }
    };
    
    const schema = parseSchema(inspection.schemaContent);
    if (!schema) return;
    
    const collectItemsWithContext = (elements, parentName = '') => {
      let items = [];
      if (!elements || !Array.isArray(elements)) return items;
      
      elements.forEach(element => {
        if (element.ElmentType === 'Item' && element.ItemId) {
          items.push({ ...element, parentName: parentName });
        }
        if (element.ElmentType === 'Div' && element.Elements && Array.isArray(element.Elements)) {
          const currentParentName = element.Name || parentName;
          items = items.concat(collectItemsWithContext(element.Elements, currentParentName));
        }
      });
      
      return items.sort((a, b) => a.ItemId - b.ItemId);
    };
    
    const items = collectItemsWithContext(schema.Elements || []);
    const newFormData = {};
    
    items.forEach(item => {
      const fieldKey = `Item${item.ItemId}`;
      newFormData[fieldKey] = '正常';
      newFormData[`${fieldKey}_Remark`] = ''; // Clear remarks
    });
    
    handleFormDataChange(newFormData);
    onAutoFill && onAutoFill(inspection.routeId, newFormData);
  };
  
  // Validate form data
  const validateFormData = React.useCallback(() => {
    const parseSchema = (content) => {
      try {
        return typeof content === 'string' ? JSON.parse(content) : content;
      } catch (error) {
        console.error('Error parsing schema content:', error);
        return null;
      }
    };
    
    const schema = parseSchema(inspection.schemaContent);
    if (!schema) return { isValid: true, errors: [] };
    
    const collectItemsWithContext = (elements, parentPath = '') => {
      let items = [];
      if (!elements || !Array.isArray(elements)) return items;
      
      elements.forEach(element => {
        if (element.ElmentType === 'Item' && element.ItemId) {
          const currentParentPath = parentPath ? `${parentPath} > ${element.Name || '檢查項目'}` : element.Name || '檢查項目';
          items.push({ ...element, fullPath: currentParentPath });
        }
        if (element.ElmentType === 'Div' && element.Elements && Array.isArray(element.Elements)) {
          const currentParentPath = parentPath ? `${parentPath} > ${element.Name || ''}` : element.Name || '';
          items = items.concat(collectItemsWithContext(element.Elements, currentParentPath));
        }
      });
      
      return items.sort((a, b) => a.ItemId - b.ItemId);
    };
    
    const items = collectItemsWithContext(schema.Elements || []);
    const errors = [];
    
    items.forEach(item => {
      const fieldKey = `Item${item.ItemId}`;
      const value = formData[fieldKey];
      
      if (!value || value.trim() === '') {
        errors.push({
          itemId: item.ItemId,
          fieldKey: fieldKey,
          itemName: item.Description || '檢查項目',
          fullPath: item.fullPath,
          formName: inspection.displayName
        });
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }, [formData, inspection.schemaContent, inspection.displayName]);

  // Get current form data for parent component
  const getCurrentFormData = React.useCallback(() => {
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = userInfoString ? JSON.parse(userInfoString) : null;
    
    return {
      ...formData,
      UserId: userInfo?.id,
      TableName: inspection.tablename,
      CheckDate: new Date().toISOString(),
      RouteId: inspection.routeId
    };
  }, [formData, inspection.tablename, inspection.routeId]);
  
  // Expose form data and validation to parent
  React.useEffect(() => {
    inspection.getCurrentFormData = getCurrentFormData;
    inspection.validateFormData = validateFormData;
  }, [getCurrentFormData, validateFormData, inspection]);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 dark:border-blue-400' 
        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    }`}>
      {/* Card Header - Material Design */}
      <div className={`p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200 ${
          isSelected 
            ? 'bg-blue-50 dark:bg-blue-900/20' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
        }`}>
        <div className="flex justify-between items-center">
          {/* Left side: Checkbox and Form Info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Selection Checkbox */}
            <div className="flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelectionChange(inspection.routeId, e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            
            {/* Form Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {inspection.displayName}
                </h3>
                {isSelected && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded">
                    已選擇
                  </span>
                )}
              </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{inspection.routeName}</span>
              </div>
            </div>
            </div>
          </div>
          {/* Right side: Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Auto Fill Normal Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAutoFill();
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200"
              title="一鍵填入正常"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm">全部正常</span>
            </button>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              title={isExpanded ? '收起表單' : '展開表單'}
            >
              <svg 
                className={`w-5 h-5 transition-transform duration-200 text-gray-600 dark:text-gray-400 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Card Content - Full display without scrolling */}
      {isExpanded && (
        <div className="bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-800">
          <div className="p-8">
            <FormRenderer 
              schemaContent={inspection.schemaContent}
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function InspectionTablet() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedForms, setSelectedForms] = useState(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [allFormsData, setAllFormsData] = useState(new Map()); // Store all form data
  const autoSaveTimerRef = useRef(null);
  const AUTO_SAVE_KEY = 'inspection_tablet_autosave';
  const AUTO_SAVE_INTERVAL = 30000; // 30 seconds
  
  // Inject custom styles on component mount
  useEffect(() => {
    injectCustomStyles();
  }, []);

  // Auto-save functions
  const saveToLocalStorage = useCallback(() => {
    if (allFormsData.size > 0) {
      const saveData = {
        timestamp: Date.now(),
        userId: user?.id,
        formsData: Object.fromEntries(allFormsData),
        selectedForms: Array.from(selectedForms),
        routeIds: inspectionData.map(item => item.routeId)
      };
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData));
      console.log('表單資料已自動暫存');
    }
  }, [allFormsData, selectedForms, inspectionData, user?.id]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Check if the saved data is for the current user and has valid route data
        if (parsedData.userId === user?.id && parsedData.formsData && parsedData.routeIds) {
          const currentRouteIds = inspectionData.map(item => item.routeId);
          const isMatchingRoutes = parsedData.routeIds.every(id => currentRouteIds.includes(id)) &&
                                 currentRouteIds.every(id => parsedData.routeIds.includes(id));
          
          if (isMatchingRoutes) {
            const restoredFormsData = new Map(Object.entries(parsedData.formsData));
            setAllFormsData(restoredFormsData);
            setSelectedForms(new Set(parsedData.selectedForms));
            setAllSelected(parsedData.selectedForms.length === inspectionData.length);
            
            // Show notification to user
            const savedTime = new Date(parsedData.timestamp).toLocaleString('zh-TW');
            alert(`已恢復 ${savedTime} 的暫存資料\n共 ${Object.keys(parsedData.formsData).length} 個表單的填寫內容已恢復`);
            return true;
          }
        }
      }
    } catch (error) {
      console.error('載入暫存資料失敗:', error);
    }
    return false;
  }, [user?.id, inspectionData]);

  const clearAutoSave = useCallback(() => {
    localStorage.removeItem(AUTO_SAVE_KEY);
    console.log('暫存資料已清空');
  }, []);

  // Handle form data changes from individual cards
  const handleFormDataChange = useCallback((routeId, formData) => {
    setAllFormsData(prevData => {
      const newData = new Map(prevData);
      newData.set(routeId.toString(), formData);
      return newData;
    });
  }, []);

  // Set up auto-save timer
  useEffect(() => {
    if (allFormsData.size > 0) {
      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
      
      // Set new timer
      autoSaveTimerRef.current = setInterval(saveToLocalStorage, AUTO_SAVE_INTERVAL);
    }
    
    // Cleanup timer on unmount or when data is empty
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [allFormsData, saveToLocalStorage]);

  useEffect(() => {
    // Check authentication
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // Get inspection data from navigation state
    const data = location.state?.inspectionData || [];
    setInspectionData(data);
    
    if (data.length > 0) {
      // Try to load saved data first
      const hasRestoredData = loadFromLocalStorage();
      
      // If no saved data, initialize all forms as selected
      if (!hasRestoredData) {
        const allRouteIds = new Set(data.map(item => item.routeId));
        setSelectedForms(allRouteIds);
        setAllSelected(true);
      }
    }

    if (data.length === 0) {
      console.warn('No inspection data provided, redirecting back');
      navigate('/inspection_work');
    }
  }, [isLoggedIn, location.state, navigate, loadFromLocalStorage]);

  // Handle checkbox selection
  const handleFormSelection = (routeId, isSelected) => {
    const newSelectedForms = new Set(selectedForms);
    if (isSelected) {
      newSelectedForms.add(routeId);
    } else {
      newSelectedForms.delete(routeId);
    }
    setSelectedForms(newSelectedForms);
    setAllSelected(newSelectedForms.size === inspectionData.length);
  };

  // Handle select all/deselect all
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedForms(new Set());
      setAllSelected(false);
    } else {
      const allRouteIds = new Set(inspectionData.map(item => item.routeId));
      setSelectedForms(allRouteIds);
      setAllSelected(true);
    }
  };

  // Auto fill form with "正常" values
  const handleAutoFillNormal = (routeId) => {
    // This will be handled by the InspectionCard component
    const event = new CustomEvent('autoFillNormal', { detail: { routeId } });
    window.dispatchEvent(event);
  };

  // Handle submitting selected forms
  const handleSubmitSelectedForms = async () => {
    setLoading(true);
    try {
      const selectedInspections = inspectionData.filter(item => selectedForms.has(item.routeId));
      const allValidationErrors = [];
      const allFormsData = [];
      
      // First, validate all selected forms
      selectedInspections.forEach(inspection => {
        if (inspection.validateFormData) {
          const validation = inspection.validateFormData();
          if (!validation.isValid) {
            allValidationErrors.push(...validation.errors);
          }
        }
        
        if (inspection.getCurrentFormData) {
          const formData = inspection.getCurrentFormData();
          allFormsData.push(formData);
        }
      });
      
      // If there are validation errors, show modal and stop submission
      if (allValidationErrors.length > 0) {
        setValidationErrors(allValidationErrors);
        setShowValidationModal(true);
        setLoading(false);
        return;
      }
      
      if (allFormsData.length === 0) {
        alert('請先填寫表單內容');
        setLoading(false);
        return;
      }
      
      const results = [];
      const successfulRouteIds = [];
      
      for (const formData of allFormsData) {
        console.log('Submitting form data:', formData);
        try {
          const response = await submitInspectionData(formData);
          results.push({ ...response, tableName: formData.TableName, routeId: formData.RouteId });
          if (response.success) {
            successfulRouteIds.push(formData.RouteId);
          }
        } catch (error) {
          results.push({ success: false, message: error.message || '提交失敗', routeId: formData.RouteId });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      if (failCount === 0) {
        alert(`所有 ${successCount} 個巡檢表單已成功提交！`);
        // Clear auto-save data after successful submission
        clearAutoSave();
        // Remove successfully submitted forms from the inspection data
        setInspectionData(prevData => 
          prevData.filter(inspection => !successfulRouteIds.includes(inspection.routeId))
        );
        // Clear selected forms after successful submission
        setSelectedForms(new Set());
        setAllSelected(false);
        // Clear form data for submitted forms
        setAllFormsData(prevData => {
          const newData = new Map(prevData);
          successfulRouteIds.forEach(routeId => newData.delete(routeId.toString()));
          return newData;
        });
      } else {
        alert(`提交完成：${successCount} 個成功，${failCount} 個失敗。請檢查失敗項目。`);
        // Remove only the successfully submitted forms
        if (successfulRouteIds.length > 0) {
          // Update auto-save after partial success
          setAllFormsData(prevData => {
            const newData = new Map(prevData);
            successfulRouteIds.forEach(routeId => newData.delete(routeId.toString()));
            return newData;
          });
          setInspectionData(prevData => 
            prevData.filter(inspection => !successfulRouteIds.includes(inspection.routeId))
          );
          // Remove successful forms from selected list
          setSelectedForms(prevSelected => {
            const newSelected = new Set(prevSelected);
            successfulRouteIds.forEach(routeId => newSelected.delete(routeId));
            return newSelected;
          });
        }
      }
      
    } catch (error) {
      console.error('Error submitting forms:', error);
      alert(`批量提交失敗: ${error.message || '請重試'}`);
    } finally {
      setLoading(false);
    }
  };


  const handleGoBack = () => {
    navigate('/inspection_work');
  };

  return (
    <div className="min-h-screen mobile-optimized bg-gray-50 dark:bg-gray-900">
      {/* Header - Material Design */}
      <div className="mobile-header bg-white dark:bg-gray-800 shadow-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Left Section - Navigation & Title */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-1 sm:space-x-2 p-2 sm:p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200 focus-ring"
                aria-label="返回上一頁"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline text-sm font-medium">返回</span>
              </button>
              <div className="border-l border-gray-300 dark:border-gray-600 h-8 hidden sm:block"></div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  📋 巡檢作業平台
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 hidden sm:block">
                    聚酯膜部平板巡檢系統
                </p>
              </div>
            </div>


            {/* Right Section - User Info */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 px-2 sm:px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-2 sm:space-x-3 text-xs sm:text-sm">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-20 sm:max-w-none">{user?.userName}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block"></div>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{inspectionData.length}</span>
                    <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">項目</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading Overlay - Material Design */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute"></div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">處理中...</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">正在提交 {selectedForms.size} 個巡檢表單</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control Panel - Material Design */}
        {inspectionData.length > 0 && (
          <div className="mobile-card mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-md mx-2 sm:mx-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">表單選擇</h2>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded">
                    {selectedForms.size} / {inspectionData.length} 已選擇
                  </span>
                  {allFormsData.size > 0 && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-medium rounded flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      自動暫存中
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleSelectAll}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  allSelected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {allSelected ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  )}
                </svg>
                <span>{allSelected ? '取消全選' : '全選表單'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Inspection Cards with Animation */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 pb-32 px-2 sm:px-0">
          {inspectionData.map((inspection, index) => (
            <div 
              key={inspection.routeId}
              className="animate-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <InspectionCard 
                inspection={inspection}
                isSelected={selectedForms.has(inspection.routeId)}
                onSelectionChange={handleFormSelection}
                onAutoFill={handleAutoFillNormal}
                initialFormData={allFormsData.get(inspection.routeId.toString()) || {}}
                onFormDataChange={handleFormDataChange}
              />
            </div>
          ))}
        </div>
        
        {/* Enhanced Fixed Submit Panel */}
        {selectedForms.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl z-50 safe-area-inset-bottom">
            <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 flex justify-center">
              <button
                onClick={handleSubmitSelectedForms}
                disabled={loading || selectedForms.size === 0}
                className="group w-1/3 relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg lg:text-xl shadow-2xl hover:shadow-green-500/30 transform hover:scale-[1.01] transition-all duration-300 disabled:transform-none disabled:shadow-lg flex items-center justify-center space-x-2 sm:space-x-3 focus-ring min-h-[56px] active:scale-[0.98]"
                aria-label={`提交 ${selectedForms.size} 個巡檢表單`}
              >
                {/* Background Animation */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                
                {loading ? (
                  <>
                    <div className="relative">
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <span>⚡ 批量提交中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="relative z-10 text-center"> 提交 {selectedForms.size} 個表單</span>
                    <div className="hidden lg:flex items-center space-x-1 text-green-100">
                    </div>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State - Material Design */}
        {inspectionData.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 border border-gray-200 dark:border-gray-700 max-w-md mx-auto shadow-md">
              <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">無可用的巡檢項目</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">請返回巡檢作業頁面重新載入或聯繫管理員</p>
              <button
                onClick={handleGoBack}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                返回上一頁
              </button>
            </div>
          </div>
        )}

        {/* Validation Error Modal */}
        {showValidationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-800 dark:text-red-200">
                      表單驗證失敗
                    </h3>
                    <p className="text-red-600 dark:text-red-300 text-sm mt-1">
                      以下檢查項目尚未填寫，請完成後再提交
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                          <span className="text-red-600 dark:text-red-300 text-sm font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-medium text-red-800 dark:text-red-200">
                            {error.formName}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-300 mt-1">
                            <span className="font-medium">檢查項目：</span>
                            {error.itemName}
                          </div>
                          {error.fullPath && (
                            <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                              路徑：{error.fullPath}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 p-6">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200"
                  >
                    確認
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectionTablet;