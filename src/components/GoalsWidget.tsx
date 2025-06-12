import React from 'react';
import { Goal } from '../types';
import { format } from 'date-fns';
import { CheckCircle, Flag, XCircle } from 'lucide-react';

interface GoalsWidgetProps {
  goals: Goal[];
}

export const GoalsWidget: React.FC<GoalsWidgetProps> = ({ goals }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {goals.length === 0 ? (
        <p className="text-slate-500">No financial goals set yet. Start by adding one!</p>
      ) : (
        goals.map(goal => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const isCompleted = goal.currentAmount >= goal.targetAmount;

          return (
            <div key={goal.id} className="bg-white rounded-lg p-5 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800">{goal.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                  {goal.priority} priority
                </span>
              </div>
              <p className="text-slate-600 text-sm mb-4">{goal.category}</p>

              <div className="mb-4">
                <div className="flex justify-between items-center text-sm text-slate-700 mb-1">
                  <span>Progress</span>
                  <span className="font-semibold">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                  <span>
                    {isCompleted ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Goal Achieved!
                      </span>
                    ) : (
                      `${formatCurrency(goal.targetAmount - goal.currentAmount)} remaining to reach goal`
                    )}
                  </span>
                  <span>{Math.min(progress, 100).toFixed(1)}% complete</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-slate-600">
                <Flag className="w-4 h-4 mr-2 text-slate-500" />
                Deadline: {format(new Date(goal.deadline), 'MMM dd, yyyy')}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};