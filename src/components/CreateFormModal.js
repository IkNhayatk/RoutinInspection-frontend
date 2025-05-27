import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { produce } from "immer";
// Import chevron icons
import { FaPlusCircle, FaQuestionCircle, FaTrashAlt, FaSlidersH, FaChevronRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ValidationRuleModal from './ValidationRuleModal.js';
import ConfirmModal from './ConfirmModal.js';
import { apiClient } from '../services/authService.js'; // 導入 apiClient

// --- Styles ---
const customStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '85%', maxWidth: '800px',
    maxHeight: '85vh',
     overflowY: 'auto', border: '1px solid #ccc',
    borderRadius: '8px', padding: '20px', backgroundColor: '#fff',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1000 },
};

// --- Type options and descriptions ---
const typeOptions = [
    { value: 'int', label: 'int' }, { value: 'float(1)', label: 'float(1)' },
    { value: 'float(2)', label: 'float(2)' }, { value: 'float(3)', label: 'float(3)' },
    { value: 'nchar(32)', label: 'nchar(32)' }, { value: 'date', label: 'date' },
    { value: 'time', label: 'time' }, { value: 'select', label: 'select' },
];
const typeDescriptions = `型態說明：\n• int: 範圍 -2147483648 至 2147483647\n• float(1): 小數點 1 位\n• float(2): 小數點 2 位\n• float(3): 小數點 3 位\n• nchar(32): 字串，長度為 32 個字\n• date: 日期\n• time: 時間\n• select: 下拉選單，請於選項輸入欄位填入多個選項，以逗號分隔`;
const validationRuleDescriptions = `檢核條件說明：\n• 檢核條件只有 int, float 才能起作用\n• 檢查規則中的數值請用 "value" 敘述\n• 數值介於 5~15 之間： value >= 5 && value <= 15\n• 數值等於 1 或 2： value == 1 || value == 2`;

// --- Helper Functions ---
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createNewField = (data = {}) => ({ // Allow passing initial data
    id: generateId(),
    type: 'field',
    fieldName: data.Name || '',
    validationRule: data.CheckCond || '',
    description: data.Description || '',
    physicalUnit: data.Unit || '',
    fieldType: data.Type || '',
    selectOptions: data.SelectOptions || '', // Ensure this is empty string by default
});

const createNewGroup = (data = {}, includeInitialField = true) => ({ 
    id: generateId(),
    type: 'group',
    groupName: data.Name || '',
    // Parse nested elements recursively if they exist, or create a new field with empty values
    items: data.Elements ? parseJsonToFormItems(data.Elements) : (includeInitialField ? [createNewField()] : []),
});

// --- NEW Helper Function: Parse Backend JSON to Frontend formItems ---
const parseJsonToFormItems = (elements) => {
    if (!Array.isArray(elements)) {
        console.error("[parseJsonToFormItems] Invalid elements structure for parsing:", elements);
        return []; // Return empty array or default structure
    }
    return elements.map((element, idx) => {
        if (element.ElmentType === "Item") {
            // Parse select type and options if the format is [s]option1,option2,...
            let fieldType = element.Type || '';
            let selectOptions = '';
            
            // Check if Type has [s] prefix for select options
            if (fieldType && fieldType.startsWith('[s]')) {
                selectOptions = fieldType.substring(3); // Remove the [s] prefix
                fieldType = 'select'; // Set the fieldType to select
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
            // Recursively parse nested Elements
            const group = createNewGroup({
                Name: element.Name,
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
        const newItem = itemType === 'group' ? createNewGroup(false) : createNewField();
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
            const parentArray = findDraftParentArray(draft);
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
    // Removed useCallback as it depends on the counter created in handleShowJson
    const transformItemsToElements = (items, counterRef) => { // Added counterRef parameter
        if (!Array.isArray(items)) return [];
        return items.map((item, index) => {
            if (item.type === 'field') {
                // *** Assign and increment ItemId ***
                const currentItemId = counterRef.current;
                counterRef.current += 1;
                
                // Format select options if the field type is 'select'
                let fieldType = item.fieldType || null;
                if (fieldType === 'select' && item.selectOptions) {
                    // Format as "[s]option1,option2,..."
                    fieldType = `[s]${item.selectOptions}`;
                }
                
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
                    Name: item.groupName || null
                };
            }
            return null;
        }).filter(Boolean);
    }; // Removed useCallback dependency array
    
    // --- Calculate total items count ---
    const calculateItemsCount = (items) => {
        let count = 0;
        items.forEach(item => {
            if (item.type === 'field') {
                count++;
            } else if (item.type === 'group' && Array.isArray(item.items)) {
                count += calculateItemsCount(item.items);
            }
        });
        return count;
    };

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
            const result = await onSubmit(formData); // Pass formData to the parent's submit handler

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

    }, [formIdentifier, formDisplayName, formItems, onSubmit, editingForm, onClose, originalFormIdentifier]); // Add onClose and originalFormIdentifier to dependencies

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
    }, [formIdentifier, formDisplayName, formItems]); // Removed transformItemsToElements from deps as it's defined inside


    // --- === Recursive Rendering Component (Using Local State) === ---
    const FormItem = ({ item, path, onUpdateItemValue, onAddItem, onDeleteItem, onOpenValidationModal }) => {
        const currentDepth = path.length - 1;
        const [localGroupName, setLocalGroupName] = useState(item.groupName || '');
        const [localFieldName, setLocalFieldName] = useState(item.fieldName || '');
        const [localDescription, setLocalDescription] = useState(item.description || '');
        const [localPhysicalUnit, setLocalPhysicalUnit] = useState(item.physicalUnit || '');
        const [localFieldType, setLocalFieldType] = useState(item.fieldType || '');
        const [localSelectOptions, setLocalSelectOptions] = useState(''); // Initialize as empty string always
        const groupPath = path.slice(0, -1).join('-') || 'root-' + path[0];
        const [isExpanded, setIsExpanded] = useState(expandedGroups[groupPath] !== undefined ? expandedGroups[groupPath] : false); // State for group expansion, based on stored state

        useEffect(() => { setLocalGroupName(item.groupName || ''); }, [item.groupName]);
        useEffect(() => { setLocalFieldName(item.fieldName || ''); }, [item.fieldName]);
        useEffect(() => { setLocalDescription(item.description || ''); }, [item.description]);
        useEffect(() => { setLocalPhysicalUnit(item.physicalUnit || ''); }, [item.physicalUnit]);
        useEffect(() => { 
            // Only update if the item actually has select options defined
            if (item.selectOptions !== undefined) {
                setLocalSelectOptions(item.selectOptions || '');
            }
        }, [item.selectOptions]);

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
             const borderColorClass = currentDepth === 0 ? 'border-gray-400' : `border-green-${Math.max(200, 500 - currentDepth * 100)}`;
             const marginLeftClass = `ml-${currentDepth * 4}`;
            return (
                <div key={item.id} className={`border-2 border-solid ${borderColorClass} rounded p-4 space-y-3 relative mt-2 ${marginLeftClass} bg-gray-50`}>
                    {/* Group Header */}
                    <div className="flex justify-between items-start mb-2">
                        {/* Left side: Title/Input */}
                        <div className="flex-grow mr-4"> {/* Added margin-right */}
                            <h3 className={`font-medium mb-1 ${currentDepth > 0 ? 'text-sm' : 'text-base'} text-gray-700`}>
                                {currentDepth > 0 ? '巢狀' : ''}欄位群組 ({item.items?.length ?? 0} 個項目)
                            </h3>
                            <input type="text" placeholder="群組名稱" name="groupName" value={localGroupName} onChange={(e) => handleLocalChange(setLocalGroupName, e)} onBlur={() => handleBlur('groupName', localGroupName)} className={`w-full p-1 border border-gray-300 rounded ${currentDepth > 0 ? 'text-xs' : 'text-sm'} focus:outline-none focus:ring-1 focus:ring-indigo-500`} />
                        </div>
                        {/* Right side: Expand and Delete Buttons */}
                        <div className="flex items-center flex-shrink-0 space-x-2"> {/* Use space-x for spacing */}
                            {/* Expand/Collapse Button */}
                            <button
                                onClick={toggleExpand}
                                className="text-gray-500 hover:text-gray-700 focus:outline-none p-1"
                                title={isExpanded ? "收起" : "展開"}
                            >
                                {isExpanded ? <FaChevronUp className="text-base align-middle" /> : <FaChevronDown className="text-base align-middle" />}
                            </button>
                            {/* Delete Button */}
                            <button onClick={() => onDeleteItem(path)} className="text-red-500 hover:text-red-700 p-1" title="刪除此群組及其所有內容">
                                <FaTrashAlt className="text-base align-middle" />
                            </button>
                        </div>
                    </div>
                    {/* Group Content (Conditional Rendering) */}
                    {isExpanded && (
                        <div className={`space-y-3 ${currentDepth === 0 ? 'pl-4 border-l-2 border-gray-200 ml-2' : 'pl-2 border-l-2 border-green-200 ml-1'}`}>
                            {Array.isArray(item.items) && item.items.map((nestedItem, index) => (
                                <FormItem key={nestedItem.id} item={nestedItem} path={[...path, index]} onUpdateItemValue={onUpdateItemValue} onAddItem={onAddItem} onDeleteItem={onDeleteItem} onOpenValidationModal={onOpenValidationModal} />
                            ))}
                            <div className="flex gap-2 pt-2">
                                <button onClick={() => onAddItem(path, 'field')} className="w-1/2 border border-dashed border-blue-400 rounded py-1 px-2 text-blue-600 hover:bg-blue-50 text-xs flex items-center justify-center transition-colors duration-150"><FaPlusCircle className="mr-1"/> 新增欄位</button>
                                <button onClick={() => onAddItem(path, 'group')} className="w-1/2 border border-dashed border-green-400 rounded py-1 px-2 text-green-600 hover:bg-green-50 text-xs flex items-center justify-center transition-colors duration-150"><FaPlusCircle className="mr-1"/> 新增巢狀群組</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        else if (item.type === 'field') {
            const borderColorClass = path.length === 1 ? 'border-blue-300' : 'border-gray-300';
            const marginLeftClass = `ml-${currentDepth * 4}`;
            return (
                <div key={item.id} className={`border border-solid ${borderColorClass} rounded p-3 space-y-2 relative bg-white shadow-sm mt-2 ${marginLeftClass}`}>
                    <div className="grid grid-cols-1 gap-2">
                         <div>
                             <label htmlFor={`${item.id}-fieldName`} className="text-xs font-medium text-gray-600 block mb-0.5">欄位名稱</label>
                             <input id={`${item.id}-fieldName`} type="text" placeholder="必填" name="fieldName" value={localFieldName} onChange={(e) => handleLocalChange(setLocalFieldName, e)} onBlur={() => handleBlur('fieldName', localFieldName)} className="w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                         </div>
                         <div>
                             <label htmlFor={`${item.id}-validationRule`} className="text-xs font-medium text-gray-600 block mb-0.5">檢核條件</label>
                             <div className="flex items-center space-x-1">
                                 <input id={`${item.id}-validationRule`} type="text" placeholder="點擊右側設定" name="validationRule" value={item.validationRule} readOnly className="flex-grow p-1 border border-gray-300 rounded text-sm bg-gray-100 cursor-not-allowed"/>
                                 <FaQuestionCircle className="text-gray-400 cursor-help flex-shrink-0" title={validationRuleDescriptions}/>
                                 <button type="button" onClick={() => onOpenValidationModal(path)} className="text-gray-500 hover:text-blue-600 p-1 flex-shrink-0" title="設定檢核條件"><FaSlidersH /></button>
                             </div>
                         </div>
                         <div>
                              <label htmlFor={`${item.id}-description`} className="text-xs font-medium text-gray-600 block mb-0.5">描述 (Help)</label>
                             <input id={`${item.id}-description`} type="text" placeholder="選填" name="description" value={localDescription} onChange={(e) => handleLocalChange(setLocalDescription, e)} onBlur={() => handleBlur('description', localDescription)} className="w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                         </div>
                         <div>
                             <label htmlFor={`${item.id}-physicalUnit`} className="text-xs font-medium text-gray-600 block mb-0.5">物理單位</label>
                             <input id={`${item.id}-physicalUnit`} type="text" placeholder="選填, e.g., mm, kg" name="physicalUnit" value={localPhysicalUnit} onChange={(e) => handleLocalChange(setLocalPhysicalUnit, e)} onBlur={() => handleBlur('physicalUnit', localPhysicalUnit)} className="w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                         </div>
                         <div>
                             <label htmlFor={`${item.id}-fieldType`} className="text-xs font-medium text-gray-600 block mb-0.5">型態 (Type)</label>
                             <div className="flex items-center space-x-1">
                                 <select id={`${item.id}-fieldType`} name="fieldType" value={localFieldType} onChange={(e) => {
                                     setLocalFieldType(e.target.value);
                                     onUpdateItemValue(path, 'fieldType', e.target.value);
                                     if (e.target.value === 'select') {
                                         setLocalSelectOptions('');
                                         onUpdateItemValue(path, 'selectOptions', '');
                                     }
                                     // Ensure the parent group remains expanded
                                     const parentGroupPath = path.slice(0, -1).join('-') || 'root-' + path[0];
                                     setExpandedGroups(prevGroups => ({ ...prevGroups, [parentGroupPath]: true }));
                                 }} className="flex-grow p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white">
                                     <option value="" disabled>--選擇型態--</option>
                                     {typeOptions.map(option => ( <option key={option.value} value={option.value}>{option.label}</option> ))}
                                 </select>
                                 <FaQuestionCircle className="text-gray-400 cursor-help flex-shrink-0" title={typeDescriptions}/>
                             </div>
                         </div>
                         {localFieldType === 'select' && ( // Conditionally render selectOptions input
                             <div>
                                 <label htmlFor={`${item.id}-selectOptions`} className="text-xs font-medium text-gray-600 block mb-0.5">選項 (Options)</label>
                                 <input id={`${item.id}-selectOptions`} type="text" placeholder="請輸入下拉選項，如: 正常,異常 或 選項1,選項2,選項3" name="selectOptions" value={localSelectOptions} onChange={(e) => handleLocalChange(setLocalSelectOptions, e)} onBlur={() => handleBlur('selectOptions', localSelectOptions)} className="w-full p-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                             </div>
                         )}
                    </div>
                    {/* Keep position top-0 */}
                    <button onClick={() => onDeleteItem(path)} className="absolute top-0 right-1 text-red-400 hover:text-red-600 p-1" title="刪除此欄位">
                        <FaTrashAlt className="text-sm align-middle" />
                    </button>
                </div>
            );
        }
        return <div className="text-red-500">Unknown item type: {item?.type}</div>;
    };


    // --- Main Return JSX ---
    return (
        <Modal isOpen={isOpen} onRequestClose={onClose} style={customStyles} contentLabel={editingForm ? "編輯表單" : "建立新表單"}> {/* <-- Dynamic Title */}
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-300">
                <h2 className="text-xl font-semibold text-gray-800">{editingForm ? "編輯表單" : "建立新表單"}</h2> {/* <-- Dynamic Title */}
                <button onClick={handleShowJson} className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none">
                    顯示預覽 JSON (Console)
                </button>
            </div>

            {/* Form Meta Inputs */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <div>
                     <label htmlFor="formIdentifier" className="block text-sm font-medium text-gray-700 mb-1">資料庫表名</label>
                     {/* Trim the value on change */}
                     <input type="text" id="formIdentifier" placeholder="必填" value={formIdentifier} onChange={(e) => setFormIdentifier(e.target.value.trim())} className="w-full p-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
                 <div>
                     <label htmlFor="formDisplayName" className="block text-sm font-medium text-gray-700 mb-1">表單名稱(顯示用)</label>
                     <input type="text" id="formDisplayName" placeholder="必填" value={formDisplayName} onChange={(e) => setFormDisplayName(e.target.value)} className="w-full p-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"/>
                 </div>
             </div>

            {/* Dynamic Content Area */}
            <div className="space-y-4 mb-6">
                 <h3 className="text-lg font-medium text-gray-700 border-b pb-1">表單結構</h3>
                {formItems.length > 0 ? (
                     formItems.map((item, index) => (
                        <FormItem key={item.id} item={item} path={[index]} onUpdateItemValue={updateItemValue} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} onOpenValidationModal={openValidationModal} />
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-4">表單目前是空的。請新增欄位或群組。</p>
                )}
                {/* Add Top-Level Item Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => handleAddItem([], 'group')} className="w-full sm:w-1/2 border-2 border-dashed border-gray-400 rounded py-2 px-3 text-gray-600 hover:bg-gray-100 hover:border-gray-500 flex items-center justify-center transition-colors duration-150">
                        <FaPlusCircle className="mr-2"/> 新增頂層群組
                    </button>
                    <button onClick={() => handleAddItem([], 'field')} className="w-full sm:w-1/2 border-2 border-dashed border-blue-400 rounded py-2 px-3 text-blue-600 hover:bg-blue-50 hover:border-blue-500 flex items-center justify-center transition-colors duration-150">
                        <FaPlusCircle className="mr-2"/> 新增頂層欄位
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center pt-4 border-t border-gray-300 mt-6">
                <div className="flex space-x-3">
                    <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors duration-150">
                        取消
                    </button>
                    {/* Move the button text inside the button tags and remove extra closing tag */}
                    <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-150">
                        {editingForm && !editingForm.isCopy ? "確認修改" : "確認建立"} {/* 判斷是否為複製狀態 */}
                    </button>
                </div>
            </div>

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
    );
}

export default CreateFormModal;
