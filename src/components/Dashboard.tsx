import React, { useState } from 'react';
import { DollarSign, TrendingUp, Target, Brain, ArrowUpCircle, ArrowDownCircle, Settings } from 'lucide-react';
import { useBudgetData } from '../hooks/useBudgetData';
import { BudgetCard } from './BudgetCard';
import { AIInsightsPanel } from './AIInsightsPanel';
import { SpendingChart } from './SpendingChart';
import { GoalsWidget } from './GoalsWidget';
import { BudgetSettingsModal } from './BudgetSettingsModal';

export const Dashboard: React.FC = () => {
  const { totalIncome, totalExpenses, netBalance, budgets, insights, spendingPatterns, goals, setBudgets } = useBudgetData();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Financial Dashboard
          </h1>
          <p className="text-slate-600 mt-2">AI-powered insights for smarter spending</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Income</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowUpCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ArrowDownCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netBalance)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${netBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <DollarSign className={`w-6 h-6 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Goals</p>
                <p className="text-2xl font-bold text-blue-600">{goals.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Spending Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Spending Analysis
              </h2>
              <SpendingChart data={spendingPatterns} />
            </div>

            {/* Budget Cards */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-800">Budget Overview</h2>
                <button
                  onClick={() => setIsBudgetModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Settings className="w-4 h-4" />
                  Set Budgets
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budgets.map(budget => (
                  <BudgetCard key={budget.id} budget={budget} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* AI Insights */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                AI Insights
              </h2>
              <AIInsightsPanel insights={insights} />
            </div>

            {/* Goals Widget */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Financial Goals
              </h2>
              <GoalsWidget goals={goals} />
            </div>
          </div>
        </div>
      </div>

      {isBudgetModalOpen && (
        <BudgetSettingsModal
          budgets={budgets}
          onSave={(updatedBudgets) => setBudgets(updatedBudgets)}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      )}
    </div>
  );
};