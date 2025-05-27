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
    // TODO: Parse 'currentRule' string and set initial state
    if (currentRule) {
        if (currentRule.includes('&&') && currentRule.includes('>=')) {
            setSelectedOption('range');
            // setRangeMin(...) // Extract value
            // setRangeMax(...) // Extract value
        } else if (currentRule.includes('==') || currentRule.includes('||')) {
            setSelectedOption('equals');
            // setEqualsValue(...) // Extract value(s)
        } else {
             setSelectedOption('no_condition');
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
    // TODO: Construct 'newRule' based on state
     switch (selectedOption) {
      case 'range':
        if (rangeMin.trim() !== '' && rangeMax.trim() !== '') newRule = `value >= ${rangeMin} && value <= ${rangeMax}`;
        else if (rangeMin.trim() !== '') newRule = `value >= ${rangeMin}`;
        else if (rangeMax.trim() !== '') newRule = `value <= ${rangeMax}`;
        break;
      case 'equals':
        if (equalsValue.trim() !== '') newRule = `value == ${equalsValue}`; // Needs logic for multiple values
        break;
      case 'no_condition': default: newRule = ''; break;
    }
    onSave(newRule);
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