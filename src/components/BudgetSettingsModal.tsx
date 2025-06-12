import React, { useState, useEffect } from 'react';
import { Budget } from '../types';

interface BudgetSettingsModalProps {
  budgets: Budget[];
  onSave: (updatedBudgets: Budget[]) => void;
  onClose: () => void;
}

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ budgets, onSave, onClose }) => {
  const [localBudgets, setLocalBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    // Initialize localBudgets when the modal opens with current budgets
    setLocalBudgets(budgets);
  }, []);

  const handleChange = (id: string, value: string) => {
    console.log(`Changing budget for ID: ${id}, new value: ${value}`);
    setLocalBudgets(prevBudgets =>
      prevBudgets.map(budget =>
        budget.id === id ? { ...budget, allocated: parseFloat(value) || 0 } : budget
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localBudgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Set Budget Allocations</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {localBudgets.map(budget => (
            <div key={budget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label htmlFor={budget.category} className="font-medium text-slate-700 w-1/3">
                {budget.category}
              </label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">₹</span>
                <input
                  type="text"
                  id={budget.category}
                  value={budget.allocated.toString()}
                  onChange={(e) => {
                    console.log('Input onChange event fired:', e.target.value);
                    handleChange(budget.id, e.target.value);
                  }}
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          ))}
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              Save Budgets
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 