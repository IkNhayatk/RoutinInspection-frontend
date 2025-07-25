import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { submitInspectionData } from '../services/authService.js';

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
          const hasItems = element.Elements.some(el => el.ElmentType === 'Item');
          const hasSubDivs = element.Elements.some(el => el.ElmentType === 'Div');

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
const InspectionCard = ({ inspection, isSelected, onSelectionChange, onAutoFill }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({});
  
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
    
    setFormData(newFormData);
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
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 ${
      'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
    }`}>
      {/* Card Header with enhanced styling */}
      <div className={`p-6 border-b-2 transition-all duration-200 ${
          isExpanded 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700' 
            : isSelected
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700'
              : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
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
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  {inspection.displayName}
                </h3>
                {isSelected && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                    已選擇
                  </span>
                )}
              </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg">{inspection.routeName}</span>
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
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-all duration-200 hover:scale-105 shadow-md"
              title="一鍵填入正常"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="text-sm font-medium">全部正常</span>
            </button>
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-3 rounded-full transition-all duration-200 ${
                isExpanded ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <svg 
                className={`w-6 h-6 transition-all duration-300 ${
                  isExpanded 
                    ? 'rotate-180 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
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
              onFormDataChange={setFormData}
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

  useEffect(() => {
    // Check authentication
    if (!isLoggedIn) {
      navigate('/');
      return;
    }

    // Get inspection data from navigation state
    const data = location.state?.inspectionData || [];
    setInspectionData(data);
    
    // Initialize all forms as selected
    if (data.length > 0) {
      const allRouteIds = new Set(data.map(item => item.routeId));
      setSelectedForms(allRouteIds);
      setAllSelected(true);
    }

    if (data.length === 0) {
      console.warn('No inspection data provided, redirecting back');
      navigate('/inspection_work');
    }
  }, [isLoggedIn, location.state, navigate]);

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
        // Remove successfully submitted forms from the inspection data
        setInspectionData(prevData => 
          prevData.filter(inspection => !successfulRouteIds.includes(inspection.routeId))
        );
        // Clear selected forms after successful submission
        setSelectedForms(new Set());
        setAllSelected(false);
      } else {
        alert(`提交完成：${successCount} 個成功，${failCount} 個失敗。請檢查失敗項目。`);
        // Remove only the successfully submitted forms
        if (successfulRouteIds.length > 0) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Enhanced Header - Tablet optimized */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleGoBack}
                className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  巡檢作業平台
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  智能化巡檢管理系統
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-3 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{user?.userName}</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{inspectionData.length}</span>
                  <span className="text-gray-600 dark:text-gray-400">個巡檢項目</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 dark:border-blue-800"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">處理中...</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">請稍待，正在提交巡檢資料</p>
              </div>
            </div>
          </div>
        )}

        {/* Select All Controls */}
        {inspectionData.length > 0 && (
          <div className="mb-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">巡檢表單選擇</h2>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                  已選擇 {selectedForms.size} / {inspectionData.length} 個表單
                </span>
              </div>
              <button
                onClick={handleSelectAll}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-md ${
                  allSelected 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Inspection Cards */}
        <div className="space-y-8 pb-32">
          {inspectionData.map((inspection) => (
            <InspectionCard 
              key={inspection.routeId}
              inspection={inspection}
              isSelected={selectedForms.has(inspection.routeId)}
              onSelectionChange={handleFormSelection}
              onAutoFill={handleAutoFillNormal}
            />
          ))}
        </div>
        
        {/* Fixed Submit Button at Bottom */}
        {selectedForms.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-t-2 border-gray-200 dark:border-gray-700 p-6 shadow-2xl z-50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">提交巡檢資料</h3>
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                    已選擇 {selectedForms.size} 個表單
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  將提交所有已選擇的巡檢表單資料
                </div>
              </div>
              
              <button
                onClick={handleSubmitSelectedForms}
                disabled={loading || selectedForms.size === 0}
                className="w-full relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-green-500/25 transform hover:scale-[1.02] transition-all duration-300 disabled:transform-none disabled:shadow-lg flex items-center justify-center space-x-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>批量提交中...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span>🚀 提交 {selectedForms.size} 個巡檢表單</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Empty State with enhanced design */}
        {inspectionData.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-3xl p-12 border border-gray-200/50 dark:border-gray-700/50 max-w-md mx-auto">
              <div className="text-gray-400 dark:text-gray-500 mb-6">
                <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">無可用的巡檢項目</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">請返回巡檢作業頁面重新載入或聯繫管理員</p>
              <button
                onClick={handleGoBack}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg"
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