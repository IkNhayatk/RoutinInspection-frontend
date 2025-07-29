import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { produce } from "immer";
// Import chevron icons
import { FaPlusCircle, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ValidationRuleModal from './ValidationRuleModal.js';
import ConfirmModal from './ConfirmModal.js';


// --- Enhanced Responsive Modal Styles with Custom Scrollbar ---
const customStyles = {
  content: {
    top: '50%', 
    left: '50%', 
    right: 'auto', 
    bottom: 'auto',
    marginRight: '-50%', 
    transform: 'translate(-50%, -50%)',
    width: '95%', 
    maxWidth: '1000px',
    maxHeight: '95vh',
    overflowY: 'auto',
    border: 'none',
    borderRadius: '20px',
    padding: '0',
    backgroundColor: '#ffffff',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
  },
  overlay: { 
    backgroundColor: 'rgba(0, 0, 0, 0.75)', 
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
};


// --- Helper Functions ---
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const createNewField = (data = {}) => ({ // Allow passing initial data
    id: generateId(),
    type: 'field',
    fieldName: data.Name || '',
    validationRule: data.CheckCond || '',
    description: data.Description || '',
    physicalUnit: data.Unit || '',
    fieldType: data.Type || 'select', // Default to select
    selectOptions: data.SelectOptions || '正常,異常', // Default to 正常,異常
});

const createNewGroup = (data = {}, includeInitialField = true) => ({ 
    id: generateId(),
    type: 'group',
    groupName: data.Name || '',
    description: data.Description || '', // Add description field
    // Parse nested elements recursively if they exist, or create a new field with empty values
    items: data.Elements ? parseJsonToFormItems(data.Elements) : (includeInitialField ? [createNewField()] : []),
});

// --- NEW Helper Function: Parse Backend JSON to Frontend formItems ---
const parseJsonToFormItems = (elements) => {
    if (!Array.isArray(elements)) {
        console.error("[parseJsonToFormItems] Invalid elements structure for parsing:", elements);
        return []; // Return empty array or default structure
    }
    return elements.map((element) => {
        if (element.ElmentType === "Item") {
            // Parse select type and options if the format is [s]option1,option2,...
            let fieldType = element.Type || '';
            let selectOptions = '';
            
            // Check if Type has [s] prefix for select options
            if (fieldType && fieldType.startsWith('[s]')) {
                selectOptions = fieldType.substring(3); // Remove the [s] prefix
                fieldType = 'select'; // Set the fieldType to select
            }
            
            // If no selectOptions specified, default to 正常,異常
            if (fieldType === 'select' && !selectOptions) {
                selectOptions = '正常,異常';
            }
            
            // Map backend Item properties to frontend field structure
            const field = createNewField({
                Name: element.Name,
                CheckCond: element.CheckCond,
                Description: element.Description,
                Unit: element.Unit,
                Type: fieldType,
                SelectOptions: selectOptions // Add the extracted select options
                // Note: DisplayOrder and other backend-specific fields are ignored here
            });
            return field;
        } else if (element.ElmentType === "Div") {
            // Map backend Div properties to frontend group structure
            // Extract Description from first Item child if available
            let groupDescription = element.Description || '';
            if (!groupDescription && element.Elements && element.Elements.length > 0) {
                const firstItem = element.Elements.find(el => el.ElmentType === "Item");
                if (firstItem && firstItem.Description) {
                    groupDescription = firstItem.Description;
                }
            }
            
            // Recursively parse nested Elements
            const group = createNewGroup({
                Name: element.Name,
                Description: groupDescription, // Use extracted description
                Elements: element.Elements, // Pass nested elements for recursive call
            }, false); // Don't add an initial field when parsing
            return group;
        } else {
            console.warn("[parseJsonToFormItems] Unknown element type during parsing:", element.ElmentType, element);
            return null; // Or handle unknown types appropriately
        }
    }).filter(Boolean); // Remove any null results from unknown types
};

// --- Moved Helper functions outside ---
const findDraftItem = (draft, path) => {
    if (!path) return null;
    let current = draft;
    for (let i = 0; i < path.length; i++) {
        const index = path[i];
        if (!Array.isArray(current) || index < 0 || index >= current.length) return null;
        if (i === path.length - 1) return current[index];
        if (current[index]?.type !== 'group' || !Array.isArray(current[index].items)) return null;
        current = current[index].items;
    }
    return null;
};

const findDraftParentArray = (draft, path) => {
    if (!path || path.length === 0) return null;
    if (path.length === 1) return draft;
    let parent = draft;
    for (let i = 0; i < path.length - 1; i++) {
        const index = path[i];
        if (!Array.isArray(parent) || index < 0 || index >= parent.length) return null;
        const currentItem = parent[index];
        if (i === path.length - 2) {
            if (currentItem?.type === 'group' && Array.isArray(currentItem.items)) return currentItem.items;
            return null;
        }
        if (currentItem?.type !== 'group' || !Array.isArray(currentItem.items)) return null;
        parent = currentItem.items;
    }
    return null;
};

// Set App Element
if (typeof window !== 'undefined') {
    Modal.setAppElement(document.getElementById('root') || document.body);
}


function CreateFormModal({ isOpen, onClose, onSubmit, editingForm }) { // <-- Add editingForm prop
    // --- State ---
    const [formIdentifier, setFormIdentifier] = useState('');
    const [formDisplayName, setFormDisplayName] = useState('');
    const [formItems, setFormItems] = useState([createNewGroup(true)]);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [editingValidationRulePath, setEditingValidationRulePath] = useState(null);
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    // --- Add state for success modal ---
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    // --- Store original identifier for comparison ---
    const [originalFormIdentifier, setOriginalFormIdentifier] = useState('');

    // --- Effect to populate form when editing ---
    useEffect(() => {
        if (isOpen && editingForm) {
            const initialIdentifier = editingForm.isCopy ? '' : (editingForm.dbName?.trim() || '');
            setFormIdentifier(initialIdentifier);
            setOriginalFormIdentifier(initialIdentifier); // Store the initial identifier
            setFormDisplayName(editingForm.isCopy ? '' : (editingForm.eFormName || ''));

            // --- Populate formItems from formJson ---
            // Ensure formJson is an object and Elements is an array
            if (editingForm.formJson && typeof editingForm.formJson === 'object' && Array.isArray(editingForm.formJson.Elements)) {
                try {
                    const parsedItems = parseJsonToFormItems(editingForm.formJson.Elements);
                    if (parsedItems.length > 0) {
                        setFormItems(parsedItems);
                    } else {
                        console.warn("[Modal Effect] Parsing resulted in empty items, resetting to default.");
                        setFormItems([createNewGroup(true)]); // Reset if parsing gives nothing
                    }
                } catch (error) {
                    console.error("[Modal Effect] Error processing formJson:", error); // Keep error log
                    setFormItems([createNewGroup(true)]); // Reset to default on error
                }
            } else {
                 // If formJson is missing or invalid, reset to default
                 console.warn("[Modal Effect] Editing form is missing valid formJson object with Elements array, resetting structure."); // Keep warning
                 setFormItems([createNewGroup(true)]);
            }
            // -----------------------------------------

        } else {
            // Reset fields when modal closes or it's a new form
            setFormIdentifier('');
            setFormDisplayName('');
            setFormItems([createNewGroup(true)]); // Reset structure for new form
            setOriginalFormIdentifier(''); // Reset original identifier
            setExpandedGroups({}); // Reset expanded groups
        }
        // Reset modals on close regardless of editing or new
        setIsErrorModalOpen(false);
        setErrorMessage('');
        setIsSuccessModalOpen(false);
        setSuccessMessage('');
    }, [isOpen, editingForm]); // Depend on isOpen and editingForm

    // --- Handlers wrapped in useCallback ---
    const handleAddItem = useCallback((path, itemType) => {
        const newItem = itemType === 'group' ? createNewGroup({}, false) : createNewField();
        setFormItems(produce(draft => {
            if (!path || path.length === 0) { draft.push(newItem); }
            else {
                const parentGroup = findDraftItem(draft, path);
                if (parentGroup?.type === 'group' && Array.isArray(parentGroup.items)) { parentGroup.items.push(newItem); }
                else { console.error("[handleAddItem] Could not find valid parent group at path:", path); }
            }
        }));
    }, [setFormItems]);

    const handleDeleteItem = useCallback((path) => {
        if (!path || path.length === 0) return;
        setFormItems(produce(draft => {
            const parentArray = findDraftParentArray(draft, path);
            const itemIndexToDelete = path[path.length - 1];
            if (parentArray?.[itemIndexToDelete]) { parentArray.splice(itemIndexToDelete, 1); }
            else { console.error("[handleDeleteItem] Could not find valid parent or index at path:", path); }
        }));
    }, [setFormItems]);

    const updateItemValue = useCallback((path, name, value) => {
        setFormItems(produce(draft => {
            const targetItem = findDraftItem(draft, path);
            if (targetItem && typeof targetItem === 'object' && name in targetItem) {
                targetItem[name] = value;
            } else {
                 console.error("[updateItemValue] Could not find target item or property name at path:", path, "Property:", name);
            }
        }));
    }, [setFormItems]);

     const openValidationModal = useCallback((path) => {
        let targetItem = null; let currentLevel = formItems;
        try {
            for (let i = 0; i < path.length; i++) {
                const index = path[i];
                if (!currentLevel?.[index]) throw new Error("Invalid index");
                targetItem = currentLevel[index];
                if (i < path.length - 1) {
                    if (targetItem.type !== 'group' || !Array.isArray(targetItem.items)) throw new Error("Invalid structure");
                    currentLevel = targetItem.items;
                }
            }
            if (targetItem?.type === 'field') {
                setEditingValidationRulePath(path); setIsValidationModalOpen(true);
            } else { console.error("Cannot open validation modal for non-field item:", targetItem); }
        } catch(e) { console.error("Error finding item for validation modal:", e, path); }
     }, [formItems, setEditingValidationRulePath, setIsValidationModalOpen]);

    const closeValidationModal = useCallback(() => {
        setIsValidationModalOpen(false); setEditingValidationRulePath(null);
    }, [setIsValidationModalOpen, setEditingValidationRulePath]);

    const handleSaveValidationRule = useCallback((newRule) => {
        if (!editingValidationRulePath) return;
        const path = editingValidationRulePath;
        setFormItems(produce(draft => {
            const targetField = findDraftItem(draft, path);
            if (targetField?.type === 'field') { targetField.validationRule = newRule; }
            else { console.error("Could not find field to save validation rule at path:", path); }
        }));
        closeValidationModal();
    }, [editingValidationRulePath, setFormItems, closeValidationModal]);

    // --- JSON Transformation (Modified for sequential ItemId) ---
    const transformItemsToElements = useCallback((items, counterRef) => { // Added counterRef parameter
        if (!Array.isArray(items)) return [];
        return items.map((item, index) => {
            if (item.type === 'field') {
                // *** Assign and increment ItemId ***
                const currentItemId = counterRef.current;
                counterRef.current += 1;
                
                // Format select options - always use select type with 正常,異常
                let fieldType = 'select';
                const selectOptions = item.selectOptions || '正常,異常';
                fieldType = `[s]${selectOptions}`;
                
                return {
                    ItemId: currentItemId, // Use the counter
                    CheckCond: item.validationRule || null,
                    ElmentType: "Item",
                    DisplayOrder: index,
                    Description: item.description || null,
                    Remark: null,
                    Type: fieldType, // Use the possibly modified field type
                    Name: item.fieldName || null,
                    Unit: item.physicalUnit || null
                };
            } else if (item.type === 'group') {
                return {
                    TableManagerId: 0,
                     // *** Pass counterRef down recursively ***
                    Elements: transformItemsToElements(item.items, counterRef),
                    TableName: null,
                    DisplayName: null,
                    ElmentType: "Div",
                    DisplayOrder: index,
                    Description: item.description || null,
                    Name: item.groupName || null
                };
            }
            return null;
        }).filter(Boolean);
    }, []); // Added useCallback with empty dependency array
    
    // --- Calculate total items count ---
    const calculateItemsCount = useCallback((items) => {
        let count = 0;
        items.forEach(item => {
            if (item.type === 'field') {
                count++;
            } else if (item.type === 'group' && Array.isArray(item.items)) {
                count += calculateItemsCount(item.items);
            }
        });
        return count;
    }, []);

    // --- Submit/Show JSON ---
    const handleSubmit = useCallback(async () => {
        // Basic validation
        if (!formIdentifier || !formDisplayName) {
             setErrorMessage('資料庫表名和表單名稱為必填欄位。');
             setIsErrorModalOpen(true);
             return;
        }

        const itemIdCounter = { current: 1 };
        const transformedElements = transformItemsToElements(formItems, itemIdCounter);
        const finalJson = {
            TableManagerId: editingForm?.formJson?.TableManagerId || 0,
            Elements: transformedElements,
            TableName: formIdentifier || null,
            DisplayName: formDisplayName || null,
            ElmentType: "Div",
            DisplayOrder: 0,
            Name: editingForm?.formJson?.Name || null
        };

        const formData = {
            formIdentifier,
            formDisplayName,
            formJson: finalJson,
            itemsCnt: calculateItemsCount(formItems),
            ...(editingForm && !editingForm.isCopy && { id: editingForm.id }),
             // --- Add original identifier if editing and changed ---
             ...(editingForm && !editingForm.isCopy && originalFormIdentifier !== formIdentifier && { originalFormIdentifier: originalFormIdentifier }),
             // --- Add isCopy flag if it's a copy ---
             ...(editingForm && editingForm.isCopy && { isCopy: true })
        };

        try {
            // Assume onSubmit returns a promise
            await onSubmit(formData); // Pass formData to the parent's submit handler

            // If onSubmit resolves, close this modal and show success
            onClose(); // Close CreateFormModal first
            setSuccessMessage(editingForm && !editingForm.isCopy ? '表單修改成功！' : '表單建立成功！'); // Set success message
            setIsSuccessModalOpen(true); // Show success modal

        } catch (error) {
            // If onSubmit rejects, show error modal
            console.error("Error submitting form:", error);
            setErrorMessage(error.message || '操作失敗，請稍後再試。');
            setIsErrorModalOpen(true);
        }

    }, [formIdentifier, formDisplayName, formItems, onSubmit, editingForm, onClose, originalFormIdentifier, calculateItemsCount, transformItemsToElements]); // Add missing dependencies

    const handleErrorModalClose = () => {
        setIsErrorModalOpen(false);
        setErrorMessage('');
    };

    // --- Add handler for success modal ---
    const handleSuccessModalClose = () => {
        setIsSuccessModalOpen(false);
        setSuccessMessage('');
        // Optionally trigger a refresh or other action after success confirmation
    };


    const handleShowJson = useCallback(() => {
        // *** Initialize the counter for this specific transformation run ***
        const itemIdCounter = { current: 1 };
        // *** Pass the counter to the transformation function ***
        const transformedElements = transformItemsToElements(formItems, itemIdCounter);
        const finalJson = {
            TableManagerId: 0,
            Elements: transformedElements,
            TableName: formIdentifier || null,
            DisplayName: formDisplayName || null,
            ElmentType: "Div",
            DisplayOrder: 0,
            Name: null
        };
        // Output to console
        console.log('Preview JSON:', JSON.stringify(finalJson, null, 2));
        // Log the final counter value (optional debugging)
        // console.log('Final ItemId Counter:', itemIdCounter.current - 1);
    }, [formIdentifier, formDisplayName, formItems, transformItemsToElements]); // Add missing dependency


    // --- === Recursive Rendering Component (Using Local State) === ---
    const FormItem = ({ item, path, onUpdateItemValue, onAddItem, onDeleteItem, onOpenValidationModal }) => {
        const currentDepth = path.length - 1;
        const [localGroupName, setLocalGroupName] = useState(item.groupName || '');
        const [localDescription, setLocalDescription] = useState(item.description || '');
        const groupPath = path.slice(0, -1).join('-') || 'root-' + path[0];
        const [isExpanded, setIsExpanded] = useState(expandedGroups[groupPath] !== undefined ? expandedGroups[groupPath] : false); // State for group expansion, based on stored state

        useEffect(() => { setLocalGroupName(item.groupName || ''); }, [item.groupName]);
        useEffect(() => { setLocalDescription(item.description || ''); }, [item.description]);

        const handleLocalChange = (setter, event) => { setter(event.target.value); };
        const handleBlur = (name, value) => { if (value !== item[name]) { onUpdateItemValue(path, name, value); } };
        const toggleExpand = () => {
            setIsExpanded(prev => {
                const newState = !prev;
                setExpandedGroups(prevGroups => ({ ...prevGroups, [groupPath]: newState }));
                return newState;
            });
        }; // Function to toggle expansion and update global state

        if (item.type === 'group') {
            const depthColors = {
                0: 'from-blue-50 to-indigo-50 border-blue-200',
                1: 'from-green-50 to-emerald-50 border-green-200',
                2: 'from-purple-50 to-violet-50 border-purple-200',
                3: 'from-orange-50 to-amber-50 border-orange-200'
            };
            const colorClass = depthColors[Math.min(currentDepth, 3)] || depthColors[3];
            const marginLeftClass = `ml-${currentDepth * 2} sm:ml-${currentDepth * 4} lg:ml-${currentDepth * 6}`;
            
            return (
                <div key={item.id} className={`bg-gradient-to-r ${colorClass} border-2 rounded-xl p-5 space-y-4 relative mt-3 ${marginLeftClass} shadow-sm hover:shadow-md transition-all duration-200`}>
                    {/* Enhanced Group Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex-grow mr-4">
                            <div className="flex items-center mb-3">
                                <div className={`w-8 h-8 ${currentDepth === 0 ? 'bg-blue-500' : currentDepth === 1 ? 'bg-green-500' : 'bg-purple-500'} rounded-full flex items-center justify-center mr-3`}>
                                    <span className="text-white text-xs font-bold">{item.items?.length ?? 0}</span>
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${currentDepth > 0 ? 'text-sm' : 'text-base'} text-gray-800`}>
                                        {currentDepth > 0 ? '子' : ''}群組
                                    </h3>
                                    <p className="text-xs text-gray-500">{item.items?.length ?? 0} 個檢查項目</p>
                                </div>
                            </div>
                            <input 
                                type="text" 
                                placeholder="請輸入群組名稱..." 
                                name="groupName" 
                                value={localGroupName} 
                                onChange={(e) => handleLocalChange(setLocalGroupName, e)} 
                                onBlur={() => handleBlur('groupName', localGroupName)} 
                                className={`w-full p-3 border-2 border-gray-200 rounded-lg ${currentDepth > 0 ? 'text-sm' : 'text-base'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white`} 
                            />                     
                            {currentDepth > 0 && (
                                <input
                                    placeholder="請輸入檢查方法(檢點、操作、檢視、量測)"
                                    name="groupDescription"
                                    value={localDescription}
                                    onChange={(e) => handleLocalChange(setLocalDescription, e)}
                                    onBlur={() => handleBlur('description', localDescription)}
                                    className={`w-full p-3 border-2 border-gray-200 rounded-lg ${currentDepth > 0 ? 'text-sm' : 'text-base'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white mt-3`}
                                />
                            )}
                        </div>
                        
                        {/* Enhanced Action Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={toggleExpand}
                                className={`p-2 rounded-lg transition-all duration-200 ${isExpanded ? 'bg-gray-200 text-gray-700' : 'bg-white text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                                title={isExpanded ? "收起群組" : "展開群組"}
                            >
                                {isExpanded ? <FaChevronUp className="text-sm" /> : <FaChevronDown className="text-sm" />}
                            </button>
                            <button 
                                onClick={() => onDeleteItem(path)} 
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 hover:text-red-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-400" 
                                title="刪除此群組及其所有內容"
                            >
                                <FaTrashAlt className="text-sm" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Enhanced Group Content */}
                    {isExpanded && (
                        <div className="space-y-3 pl-2">
                            {Array.isArray(item.items) && item.items.map((nestedItem, index) => (
                                <FormItem 
                                    key={nestedItem.id} 
                                    item={nestedItem} 
                                    path={[...path, index]} 
                                    onUpdateItemValue={onUpdateItemValue} 
                                    onAddItem={onAddItem} 
                                    onDeleteItem={onDeleteItem} 
                                    onOpenValidationModal={onOpenValidationModal} 
                                />
                            ))}
                            
                            {/* Enhanced Add Field Button */}
                            <div className="pt-3 mt-4 border-t border-gray-200">
                                <button 
                                    onClick={() => onAddItem(path, 'field')} 
                                    className="w-full bg-white border-2 border-dashed border-blue-300 rounded-lg py-3 px-4 text-blue-600 hover:bg-blue-50 hover:border-blue-400 text-sm font-medium flex items-center justify-center transition-all duration-200 group"
                                >
                                    <FaPlusCircle className="mr-2 group-hover:scale-110 transition-transform duration-200"/> 
                                    新增檢查項目
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

    };


    // --- Main Return JSX ---
    return (
        <>
            {/* Hide All Scrollbars */}
            <style>{`
                /* Hide scrollbar for Webkit browsers (Chrome, Safari, Edge) */
                .ReactModal__Content::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                    display: none;
                }
                
                /* Hide scrollbar for Firefox */
                .ReactModal__Content {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                
                /* Smooth scrolling behavior */
                .ReactModal__Content {
                    scroll-behavior: smooth;
                }
                
                /* Ensure proper positioning */
                .ReactModal__Content {
                    position: relative;
                }
                
                /* Sticky header context */
                .sticky {
                    position: sticky;
                    z-index: 20;
                }
            `}</style>
            
            <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles} contentLabel={editingForm ? "編輯表單" : "建立新表單"}>
            {/* Enhanced Responsive Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                            <FaPlusCircle className="text-lg sm:text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold">{editingForm ? "編輯表單" : "建立新表單"}</h2>
                            <p className="text-blue-100 text-xs sm:text-sm">設計您的巡檢表單結構</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
                        <button 
                            onClick={handleShowJson} 
                            className="text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10 px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                        >
                            <span className="hidden sm:inline">預覽 JSON</span>
                            <span className="sm:hidden">JSON</span>
                        </button>
                        <button 
                            onClick={onClose} 
                            className="text-blue-100 hover:text-white hover:bg-red-500 hover:bg-opacity-80 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 text-lg font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Responsive Modal Body */}
            <div className="px-4 sm:px-8 py-6">

            {/* Enhanced Form Meta Inputs */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <span className="text-white text-xs font-bold">1</span>
                    </div>
                    基本信息
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label htmlFor="formIdentifier" className="block text-sm font-semibold text-gray-700">
                            資料庫表名 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="formIdentifier" 
                            placeholder="請輸入表名..." 
                            value={formIdentifier} 
                            onChange={(e) => setFormIdentifier(e.target.value.trim())} 
                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        />
                        <p className="text-xs text-gray-500">用於資料庫中的表格名稱</p>
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="formDisplayName" className="block text-sm font-semibold text-gray-700">
                            表單顯示名稱 <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="formDisplayName" 
                            placeholder="請輸入顯示名稱..." 
                            value={formDisplayName} 
                            onChange={(e) => setFormDisplayName(e.target.value)} 
                            className="w-full p-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-300"
                        />
                        <p className="text-xs text-gray-500">用戶在介面上看到的表單名稱</p>
                    </div>
                </div>
            </div>

            {/* Enhanced Form Structure Area */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-xs font-bold">2</span>
                        </div>
                        表單結構設計
                    </h3>
                    <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        {formItems.length} 個群組
                    </div>
                </div>
                
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 min-h-[200px]">
                    {formItems.length > 0 ? (
                        <div className="space-y-4">
                            {formItems.map((item, index) => (
                                <FormItem 
                                    key={item.id} 
                                    item={item} 
                                    path={[index]} 
                                    onUpdateItemValue={updateItemValue} 
                                    onAddItem={handleAddItem} 
                                    onDeleteItem={handleDeleteItem} 
                                    onOpenValidationModal={openValidationModal} 
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaPlusCircle className="text-2xl text-gray-400" />
                            </div>
                            <p className="text-gray-500 mb-2">表單結構尚未建立</p>
                            <p className="text-sm text-gray-400">請點擊下方按鈕開始建立您的表單結構</p>
                        </div>
                    )}
                    
                    {/* Enhanced Add Button */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button 
                            onClick={() => handleAddItem([], 'group')} 
                            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-dashed border-blue-300 rounded-xl py-4 px-6 text-blue-600 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-400 flex items-center justify-center transition-all duration-200 group"
                        >
                            <FaPlusCircle className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200"/> 
                            <span className="font-semibold">新增表單群組</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Responsive Footer */}
            <div className="bg-gray-50 px-4 sm:px-8 py-6 rounded-b-2xl border-t border-gray-200">
                <div className="flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center space-y-reverse space-y-3 sm:space-y-0 sm:space-x-4">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-all duration-200 text-center"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        className="px-6 sm:px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl text-center"
                    >
                        {editingForm && !editingForm.isCopy ? "✓ 確認修改" : "✓ 確認建立"}
                    </button>
                </div>
            </div>
            
            </div> {/* Close Modal Body */}

            {/* Validation Rule Modal */}
            <ValidationRuleModal
                isOpen={isValidationModalOpen}
                onClose={closeValidationModal}
                onSave={handleSaveValidationRule}
                currentRule={(() => {
                    if (!editingValidationRulePath) return '';
                    let item = formItems;
                    try {
                        for(const index of editingValidationRulePath) {
                            if (Array.isArray(item)) { item = item[index]; }
                            else { throw new Error("Invalid structure"); }
                        }
                        return item?.type === 'field' ? item.validationRule || '' : '';
                    } catch(e) { return ''; }
                })()}
            />
            {/* Error Modal */}
            <ConfirmModal
                isOpen={isErrorModalOpen}
                onClose={handleErrorModalClose}
                onConfirm={handleErrorModalClose}
                title="錯誤"
                message={errorMessage}
                confirmText="確定"
                cancelText="關閉"
                theme="warning"
            />

            {/* --- Add Success Modal --- */}
            <ConfirmModal
                isOpen={isSuccessModalOpen}
                onClose={handleSuccessModalClose}
                onConfirm={handleSuccessModalClose} // Simple close on confirm
                title="成功"
                message={successMessage}
                confirmText="確認"
                theme="success" // Use the new success theme
                showCancelButton={false} // Hide cancel button
            />
        </Modal>
        </>
    );
}

export default CreateFormModal;