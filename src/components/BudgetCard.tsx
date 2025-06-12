import React from 'react';
import { Budget } from '../types';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ budget }) => {
  const percentage = budget.allocated === 0 ? 0 : (budget.spent / budget.allocated) * 100;
  const remaining = budget.allocated - budget.spent;

  const getStatusIcon = () => {
    if (percentage >= 90) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (percentage >= 70) return <Clock className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusColor = () => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">{budget.category}</h3>
        {getStatusIcon()}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Spent</span>
          <span className={`font-semibold ${getStatusColor()}`}>
            {formatCurrency(budget.spent)}
          </span>
        </div>
        
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Remaining</span>
          <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(remaining)}
          </span>
        </div>
        
        <div className="text-xs text-slate-500 mt-2">
          {percentage.toFixed(1)}% of {formatCurrency(budget.allocated)} used
        </div>
      </div>
    </div>
  );
};