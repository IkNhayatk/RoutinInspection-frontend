import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

// --- Modal Styles ---
const validationModalStyles = {
  content: {
    top: '50%', left: '50%', right: 'auto', bottom: 'auto',
    marginRight: '-50%', transform: 'translate(-50%, -50%)',
    width: '90%', maxWidth: '450px', border: '1px solid #ccc',
    borderRadius: '8px', padding: '20px', backgroundColor: '#fff',
  },
  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1050 },
};

// Modal.setAppElement('#root'); // Ensure this is set somewhere

function ValidationRuleModal({ isOpen, onClose, onSave, currentRule }) {

  const [selectedOption, setSelectedOption] = useState('no_condition');
  const [rangeMin, setRangeMin] = useState('');
  const [rangeMax, setRangeMax] = useState('');
  const [equalsValue, setEqualsValue] = useState('');

  useEffect(() => {
    console.log("Initializing validation modal with rule:", currentRule);
    
    if (currentRule && currentRule.trim() !== '') {
      // Parse range condition: "value >= 10 && value <= 50"
      const rangeMatch = currentRule.match(/value\s*>=\s*(\d*\.?\d+)\s*&&\s*value\s*<=\s*(\d*\.?\d+)/);
      const minOnlyMatch = currentRule.match(/value\s*>=\s*(\d*\.?\d+)$/);
      const maxOnlyMatch = currentRule.match(/value\s*<=\s*(\d*\.?\d+)$/);
      
      // Parse equals condition: "value == 1 || value == 2" or "value == 1"
      const equalsMatch = currentRule.match(/value\s*==\s*([\d\s,.|]+)/g);
      
      if (rangeMatch) {
        setSelectedOption('range');
        setRangeMin(rangeMatch[1]);
        setRangeMax(rangeMatch[2]);
        setEqualsValue('');
      } else if (minOnlyMatch && !currentRule.includes('<=')) {
        setSelectedOption('range');
        setRangeMin(minOnlyMatch[1]);
        setRangeMax('');
        setEqualsValue('');
      } else if (maxOnlyMatch && !currentRule.includes('>=')) {
        setSelectedOption('range');
        setRangeMin('');
        setRangeMax(maxOnlyMatch[1]);
        setEqualsValue('');
      } else if (equalsMatch) {
        setSelectedOption('equals');
        setRangeMin('');
        setRangeMax('');
        // Extract all values from equals conditions
        const values = equalsMatch.map(match => {
          const valueMatch = match.match(/value\s*==\s*([\d.]+)/);
          return valueMatch ? valueMatch[1] : '';
        }).filter(val => val !== '');
        setEqualsValue(values.join(', '));
      } else {
        setSelectedOption('no_condition');
        setRangeMin('');
        setRangeMax('');
        setEqualsValue('');
      }
    } else {
      setSelectedOption('no_condition');
      setRangeMin('');
      setRangeMax('');
      setEqualsValue('');
    }
  }, [currentRule, isOpen]);


  const handleConfirm = () => {
    let newRule = '';
    
    switch (selectedOption) {
      case 'range':
        const min = rangeMin.trim();
        const max = rangeMax.trim();
        
        if (min !== '' && max !== '') {
          const minNum = parseFloat(min);
          const maxNum = parseFloat(max);
          if (minNum <= maxNum) {
            newRule = `value >= ${min} && value <= ${max}`;
          } else {
            alert('最小值不能大於最大值');
            return;
          }
        } else if (min !== '') {
          newRule = `value >= ${min}`;
        } else if (max !== '') {
          newRule = `value <= ${max}`;
        }
        break;
        
      case 'equals':
        if (equalsValue.trim() !== '') {
          const values = equalsValue.split(',').map(v => v.trim()).filter(v => v !== '');
          if (values.length === 1) {
            newRule = `value == ${values[0]}`;
          } else if (values.length > 1) {
            newRule = values.map(v => `value == ${v}`).join(' || ');
          }
        }
        break;
        
      case 'no_condition':
      default:
        newRule = '';
        break;
    }
    
    onSave(newRule);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={validationModalStyles}
      contentLabel="設定檢核條件 Modal"
      // ariaHideApp={false}
    >
      <h3 className="text-lg font-semibold mb-4">設定檢核條件</h3>
      <div className="space-y-3">
        {/* Radio Buttons */}
        <div className="flex items-center">
          <input type="radio" id="no_condition" name="validationType" value="no_condition" checked={selectedOption === 'no_condition'} onChange={(e) => setSelectedOption(e.target.value)} className="mr-2"/>
          <label htmlFor="no_condition" className="text-sm">無判斷條件</label>
        </div>
        <div className="flex items-center">
          <input type="radio" id="range" name="validationType" value="range" checked={selectedOption === 'range'} onChange={(e) => setSelectedOption(e.target.value)} className="mr-2"/>
          <label htmlFor="range" className="text-sm">數值範圍比較</label>
        </div>
        {/* Conditional Inputs for Range */}
        {selectedOption === 'range' && (
          <div className="pl-6 flex items-center space-x-2">
            <input type="number" value={rangeMin} onChange={(e) => setRangeMin(e.target.value)} className="w-20 p-1 border rounded text-sm"/>
            <span className="text-sm">&lt;= value &lt;=</span>
            <input type="number" value={rangeMax} onChange={(e) => setRangeMax(e.target.value)} className="w-20 p-1 border rounded text-sm"/>
          </div>
        )}
        <div className="flex items-center">
          <input type="radio" id="equals" name="validationType" value="equals" checked={selectedOption === 'equals'} onChange={(e) => setSelectedOption(e.target.value)} className="mr-2"/>
          <label htmlFor="equals" className="text-sm">數值等於</label>
        </div>
        {/* Conditional Inputs for Equals */}
        {selectedOption === 'equals' && (
          <div className="pl-6">
             <input type="text" placeholder="輸入數值 (用 , 分隔)" value={equalsValue} onChange={(e) => setEqualsValue(e.target.value)} className="w-full p-1 border rounded text-sm"/>
             <p className='text-xs text-gray-500 mt-1'>若需多個條件請用 , 分隔 (例如: 1, 2) </p>
          </div>
        )}
      </div>
      {/* Footer Buttons */}
      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-1 px-3 rounded text-sm">取消</button>
        <button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm">確認</button>
      </div>
    </Modal>
  );
}

export default ValidationRuleModal;