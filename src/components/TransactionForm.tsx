import React, { useState, useEffect } from 'react';
import { Plus, Receipt, Calendar, Tag } from 'lucide-react';
import { Transaction } from '../types';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onTransactionAdded: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    recurring: false,
    tags: ''
  });
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isCategorizing, setIsCategorizing] = useState(false);

  const categories = [
    'Food', 'Transportation', 'Entertainment', 'Education', 
    'Healthcare', 'Shopping', 'Utilities', 'Income', 'Other'
  ];

  // Function to call the FastAPI backend for category suggestion
  const fetchSuggestedCategory = async (description: string) => {
    if (!description) {
      setSuggestedCategory(null);
      return;
    }
    setIsCategorizing(true);
    try {
      const response = await fetch('http://localhost:8000/categorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const category = data.category;
      
      // Only suggest if it's a valid category in our predefined list and is a string
      if (typeof category === 'string' && categories.includes(category)) {
        setSuggestedCategory(category);
        setFormData(prev => ({
          ...prev, 
          category,
          type: category === 'Income' ? 'income' : 'expense' // Automatically set type based on suggested category
        }));
      } else {
        setSuggestedCategory(null);
      }
    } catch (error) {
      console.error("Error fetching suggested category:", error);
      setSuggestedCategory(null);
    } finally {
      setIsCategorizing(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSuggestedCategory(formData.description);
    }, 500); // Debounce time

    return () => {
      clearTimeout(handler);
    };
  }, [formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.description) return;

    const transaction: Omit<Transaction, 'id'> = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      type: formData.type,
      recurring: formData.recurring,
      tags: formData.tags === '' ? null : formData.tags
    };

    await onAddTransaction(transaction);
    setFormData({
      amount: '',
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      recurring: false,
      tags: ''
    });
    setSuggestedCategory(null);
    onTransactionAdded();
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-slate-800">Add Transaction</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'income' | 'expense' }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          >
            <option value="">Select category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of transaction"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
          {isCategorizing && (
            <p className="mt-2 text-sm text-slate-500">Analyzing description...</p>
          )}
          {!isCategorizing && suggestedCategory && (
            <p className="mt-2 text-sm text-slate-500">
              Suggested Category: <span className="font-semibold text-blue-600">{suggestedCategory}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., groceries, essential"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="recurring"
            checked={formData.recurring}
            onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="recurring" className="text-sm text-slate-700">
            This is a recurring transaction
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Transaction
        </button>
      </form>
    </div>
  );
};