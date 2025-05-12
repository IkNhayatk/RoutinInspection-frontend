// src/pages/FormSettings.js

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar.js';
import LogoutButton from '../components/LogoutButton.js';
import { apiClient } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.js';
import { FaSearch, FaRegFolderOpen, FaPencilAlt, FaTrashAlt, FaRegCopy } from 'react-icons/fa';
import CreateFormModal from '../components/CreateFormModal.js'; // Import the modal
import ConfirmModal from '../components/ConfirmModal.js'; // 導入自定義確認對話框

function FormSettings() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState([]); // State for the *list* of forms from DB
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0); // State for total number of items
  const [isModalOpen, setIsModalOpen] = useState(false); // State for the create form modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for the delete confirmation modal
  const [formToDelete, setFormToDelete] = useState(null); // State to store the form to be deleted
  const [editingForm, setEditingForm] = useState(null); // 新增: 編輯中的表單
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // State for the success confirmation modal

  // --- Handlers for FormSettings page (Search, Pagination, API calls for list) ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (searchTerm.length === 4) {
          // 新增：依部門代號呼叫搜尋 API
          // ... (search logic remains the same, assuming it also needs parsing if formJson is included)
          const response = await apiClient.get('/api/search-department', {
            params: { code: searchTerm }
          });
          const mapped = response.data.map(item => {
             let parsedJson = null;
             try {
               if (item.formJson) {
                 parsedJson = typeof item.formJson === 'string' ? JSON.parse(item.formJson) : item.formJson;
               }
             } catch (e) {
               console.error(`Error parsing formJson for item ID ${item.id}:`, e);
             }
             return {
               id: item.id,
               formIdentifier: item.formIdentifier,
               dbName: item.dbName,
               eFormName: item.eFormName,
               format: 'N/A',
               mode: item.mode ?? 0,
               formJson: parsedJson // Use parsed JSON
             };
          });
          setFormData(mapped);
          setTotalItems(mapped.length);
        } else if (searchTerm.length > 0) {
          // 如果有搜尋條件但長度不為4，仍然顯示所有資料但不過濾
          const response = await apiClient.get(`/forms?page=${currentPage}&limit=${rowsPerPage}`);
          if (response.data.success) {
            const mappedForms = response.data.forms.map(form => {
              let parsedJson = null;
              try {
                // Check if formJson exists and is a string before parsing
                if (form.formJson) {
                   parsedJson = typeof form.formJson === 'string' ? JSON.parse(form.formJson) : form.formJson;
                }
              } catch (e) {
                console.error(`Error parsing formJson for form ID ${form.id}:`, e);
                // Keep parsedJson as null if parsing fails
              }
              // Explicitly map required fields instead of using spread (...)
              return {
                id: form.id,
                formIdentifier: form.formIdentifier,
                dbName: form.dbName,
                eFormName: form.eFormName,
                format: 'N/A', // Or derive from form if available
                mode: form.mode ?? 0,
                formJson: parsedJson, // Use the parsed JSON object
                // Add other necessary fields from 'form' explicitly if needed
              };
            });
            setFormData(mappedForms);
            setTotalItems(response.data.total);
          } else {
            console.error('Failed to fetch forms:', response.data.message);
            setFormData([]);
            setTotalItems(0);
          }
        } else {
          // 無搜尋條件時顯示所有資料
          const response = await apiClient.get(`/forms?page=${currentPage}&limit=${rowsPerPage}`);
          if (response.data.success) {
            const mappedForms = response.data.forms.map(form => {
              let parsedJson = null;
              try {
                // Check if formJson exists and is a string before parsing
                if (form.formJson) {
                   parsedJson = typeof form.formJson === 'string' ? JSON.parse(form.formJson) : form.formJson;
                }
              } catch (e) {
                console.error(`Error parsing formJson for form ID ${form.id}:`, e);
                // Keep parsedJson as null if parsing fails
              }
              // Explicitly map required fields instead of using spread (...)
              return {
                id: form.id,
                formIdentifier: form.formIdentifier,
                dbName: form.dbName,
                eFormName: form.eFormName,
                format: 'N/A', // Or derive from form if available
                mode: form.mode ?? 0,
                formJson: parsedJson, // Use the parsed JSON object
                // Add other necessary fields from 'form' explicitly if needed
              };
            });
            setFormData(mappedForms);
            setTotalItems(response.data.total);
          } else {
            console.error('Failed to fetch forms:', response.data.message);
            setFormData([]);
            setTotalItems(0);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        // Keep existing error handling for search term
        if (searchTerm.length === 4) {
          setFormData([]);
          setTotalItems(0);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, rowsPerPage, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  const handleEditForm = async (item) => {
    setEditingForm(item); // 設定要編輯的表單
    setIsModalOpen(true); // <--- 這行會將 isModalOpen 設為 true，觸發 Modal 開啟
  };

  const handleDeleteForm = (item) => {
    console.log('Delete Form:', item);
    setFormToDelete(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (formToDelete) {
      try {
        await apiClient.put(`/forms/${formToDelete.id}/mode`, { mode: 3 });
        setFormData(formData.filter(form => form.id !== formToDelete.id));
      } catch (error) {
        console.error('Error deleting form:', error);
      } finally {
        setIsDeleteModalOpen(false);
        setFormToDelete(null);
      }
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setFormToDelete(null);
  };

  const handleCopyForm = (item) => {
    // 複製時，dbName 與 eFormName 設為空，其餘資料保留
    setEditingForm({
      ...item,
      dbName: '',
      eFormName: '',
      formIdentifier: '', // 保險起見
      formDisplayName: '', // 保險起見
      isCopy: true // 標記為複製
    });
    setIsModalOpen(true);
  };

  const handleModeToggle = async (item) => {
    const newMode = item.mode === 1 ? 0 : 1;
    try {
      const response = await apiClient.put(`/forms/${item.id}/mode`, { mode: newMode });
      if (response.data.success) {
        setFormData(formData.map(form =>
          form.id === item.id ? { ...form, mode: newMode } : form
        ));
      } else {
        console.error('Failed to update mode:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating mode:', error);
    }
  };


  // --- Handlers for the Modal ---
  const handleOpenCreateModal = () => {
    setEditingForm(null); // 建立新表單時清空編輯狀態
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingForm(null); // 關閉時清空編輯狀態
  };
  const handleFormSubmit = async (submittedFormData) => {
      console.log('Form submitted from modal:', submittedFormData);
      // Check if it's an edit or create based on presence of id and isCopy flag
      const isEditing = !!submittedFormData.id && !(submittedFormData.isCopy === true);
      const url = isEditing ? `/forms/${submittedFormData.id}` : '/forms';
      const method = isEditing ? 'put' : 'post';

      try {
          // Ensure formJson is stringified before sending and include itemsCnt
          const payload = {
              ...submittedFormData,
              formJson: JSON.stringify(submittedFormData.formJson), // Stringify formJson
              itemsCnt: submittedFormData.itemsCnt // Explicitly include itemsCnt
          };
          // Remove id from payload if it exists, as it's in the URL for PUT
          if (isEditing) {
              delete payload.id;
          }
          // Ensure isCopy flag is included in payload for backend to handle
          if (submittedFormData.isCopy === true) {
              payload.isCopy = true;
          }

          const response = await apiClient[method](url, payload);

      if (response.data.success) {
        // Refetch data to show the updated list
        // A simpler approach than manually updating the state, ensures consistency
         const refetchResponse = await apiClient.get(`/forms?page=${currentPage}&limit=${rowsPerPage}`);
         if (refetchResponse.data.success) {
            const mappedForms = refetchResponse.data.forms.map(form => {
               let parsedJson = null;
               try {
                 if (form.formJson) {
                    parsedJson = typeof form.formJson === 'string' ? JSON.parse(form.formJson) : form.formJson;
                 }
               } catch (e) { console.error(`Error parsing formJson for form ID ${form.id}:`, e); }
               return {
                 id: form.id,
                 formIdentifier: form.formIdentifier,
                 dbName: form.dbName,
                 eFormName: form.eFormName,
                 format: 'N/A',
                 mode: form.mode ?? 0,
                 formJson: parsedJson,
               };
             });
             setFormData(mappedForms);
             setTotalItems(refetchResponse.data.total);
         } else {
              console.error('Failed to refetch forms after submit:', refetchResponse.data.message);
              // Optionally trigger a full page reload or show an error
         }

      } else {
        console.error(`Error ${isEditing ? 'updating' : 'creating'} form:`, response.data.message);
        // TODO: Show error message to user
      }
      setIsSuccessModalOpen(true); // 顯示成功提示模態框
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} form:`, error);
      // TODO: Show error message to user
    }
  };

   // --- Calculate displayed data for the table ---
   // Apply filtering to formData list only if searchTerm is not empty
   let displayedData = formData;
   if (searchTerm) {
     const filteredFormData = formData.filter(item =>
       (item.dbName && typeof item.dbName === 'string' && item.dbName.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (item.eFormName && typeof item.eFormName === 'string' && item.eFormName.toLowerCase().includes(searchTerm.toLowerCase()))
     );
     displayedData = filteredFormData;
   }
   const totalPages = Math.ceil(totalItems / rowsPerPage);


  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">表單設定</h1>
          <LogoutButton />
        </header>

        {/* ***** THIS IS THE MAIN CONTENT AREA TO CLEAN UP ***** */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">

            {/* 1. Top Bar: Search and Create Button */}
            <div className="flex justify-between items-center mb-4 gap-4">
              <div className="relative flex-grow max-w-xs">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><FaSearch className="text-gray-400" /></span>
                <input type="text" placeholder="請輸入部門代號" value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md ..."/>
              </div>
              {/* Button now opens the modal */}
              <button onClick={handleOpenCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ...">
                建立新表單
              </button>
            </div>

            {/* 2. Table Area (Displaying list of forms) */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">資料庫表單名稱</th>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">電子表單名稱</th>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">模式</th>
                    <th scope="col" className="px-6 py-3 text-gray-900 dark:text-white">操作</th>
                    <th scope="col" className="px-6 py-3 hidden">JSON</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center">載入中...</td></tr>
                  ) : displayedData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center"> {/* Updated colSpan to 4 */}
                        <div className="flex flex-col items-center justify-center ..."><FaRegFolderOpen className="text-4xl mb-2" /><span>無資料...</span></div>
                      </td>
                    </tr>
                  ) : (
                    // Render the list of existing forms fetched from backend
                    displayedData.map((item) => (
                      <tr key={item.id /* Using id as unique key */}>
                        <td className="px-6 py-4 text-center text-gray-900 dark:text-white">{item.dbName ?? 'N/A'}</td>
                        <td className="px-6 py-4 text-center text-gray-900 dark:text-white">{item.eFormName ?? 'N/A'}</td>
                        <td className="px-6 py-4 text-center cursor-pointer text-gray-900 dark:text-white" onClick={() => handleModeToggle(item)}>
                          {item.mode === 1 ? (
                            <span className="px-2 py-1 rounded-full text-blue-800  dark:bg-blue-900">啟用</span>
                          ) : item.mode === 0 ? (
                            <span className="px-2 py-1 rounded-full text-green-800 dark:bg-red-500">測試</span>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-3">
                            {/* Use handlers specific to FormSettings list items */}
                            <button onClick={() => handleEditForm(item)} className="text-blue-600 ..."><FaPencilAlt /></button> {/* <--- 這個按鈕觸發 handleEditForm */}
                            <button onClick={() => handleDeleteForm(item)} className="text-red-600 ..."><FaTrashAlt /></button>
                            <button onClick={() => handleCopyForm(item)} className="text-green-600 ..."><FaRegCopy /></button>
                          </div>
                        </td>
                        {/* Stringify the object before rendering, even if hidden */}
                        <td className="hidden">{item.formJson ? JSON.stringify(item.formJson) : 'N/A'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. Pagination Area */}
            {!loading && displayedData.length > 0 && (
                <div className="flex justify-end items-center mt-4 ...">
                   {/* Pagination controls */}
                   <div className="flex items-center space-x-2">
                     <select value={rowsPerPage} onChange={handleRowsPerPageChange} className="border border-gray-300 rounded p-2">
                       <option value={5}>5</option>
                       <option value={10}>10</option>
                       <option value={20}>20</option>
                     </select>
                     <span className="text-gray-500 dark:text-gray-400">
                       頁面 {currentPage} / {totalPages}
                     </span>
                     <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50">
                       上一頁
                     </button>
                     <button onClick={handleNextPage} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50">
                       下一頁
                     </button>
                   </div>
                </div>
            )}

             {/* **** NO STATIC FORM BUILDER UI HERE **** */}

          </div>
        </main>
        {/* ***** END OF MAIN CONTENT AREA ***** */}


        {/* Modal is rendered conditionally here, outside the main content flow */}
        <CreateFormModal
            isOpen={isModalOpen} // <--- Modal 的顯示與否由 isModalOpen 決定
            onClose={handleCloseModal}
            onSubmit={handleFormSubmit}
            editingForm={editingForm} // 新增: 傳遞編輯資料
        />
        <ConfirmModal 
          isOpen={isDeleteModalOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="確認刪除表單"
          message={formToDelete ? `確定要刪除表單「${formToDelete.eFormName}」嗎？` : "確定要刪除這個表單嗎？"}
          confirmText="刪除"
          cancelText="取消"
          theme="delete" // 新增這一行，指定紅色主題
        />
        <ConfirmModal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            handleCloseModal();
          }}
          onConfirm={() => {
            setIsSuccessModalOpen(false);
            handleCloseModal();
          }}
          title="更新成功"
          message="表單已成功更新。"
          confirmText="確認"
          cancelText="關閉"
          theme="success"
        />
      </div>
    </div>
  );
}

export default FormSettings;