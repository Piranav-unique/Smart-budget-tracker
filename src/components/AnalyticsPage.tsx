import React, { useMemo } from 'react';
import { useBudgetData } from '../hooks/useBudgetData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface CategorySpending {
  category: string;
  amount: number;
}

export const AnalyticsPage: React.FC = () => {
  const { transactions, totalIncome, totalExpenses, budgets: rawBudgets, spendingPatterns } = useBudgetData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Calculate monthly spending
  const monthlySpending = useMemo(() => {
    const data: { [key: string]: number } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const month = new Date(t.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      data[month] = (data[month] || 0) + t.amount;
    });
    return Object.entries(data).map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(2)) }));
  }, [transactions]);

  // Calculate income vs expense over time
  const incomeExpenseData = useMemo(() => {
    const dataMap: { [key: string]: { income: number; expense: number } } = {};

    transactions.forEach(t => {
      const month = new Date(t.date).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      if (!dataMap[month]) {
        dataMap[month] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        dataMap[month].income += t.amount;
      } else {
        dataMap[month].expense += t.amount;
      }
    });

    return Object.entries(dataMap).map(([name, values]) => ({ name, income: parseFloat(values.income.toFixed(2)), expense: parseFloat(values.expense.toFixed(2)) }));
  }, [transactions]);

  // Aggregate spending by category for Pie Chart
  const categorySpending: CategorySpending[] = useMemo(() => {
    const spendingMap: { [key: string]: number } = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
    });
    return Object.entries(spendingMap).map(([category, amount]) => ({ category, amount: parseFloat(amount.toFixed(2)) }));
  }, [transactions]);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF69B4', '#00CED1', '#DA70D6', '#ADFF2F'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-slate-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate total allocated budget
  const totalAllocatedBudget = useMemo(() => {
    return rawBudgets.reduce((sum, budget) => sum + budget.allocated, 0);
  }, [rawBudgets]);

  const budgetVsActualData = useMemo(() => {
    return [
      { name: 'Allocated Budget', value: totalAllocatedBudget },
      { name: 'Total Expenses', value: totalExpenses }
    ];
  }, [totalAllocatedBudget, totalExpenses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:pl-64">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20 lg:pt-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
          Financial Analytics
        </h1>

        {/* Budget vs. Actual Spending */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Budget vs. Actual Spending</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={budgetVsActualData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis type="number" tickFormatter={formatCurrency} className="text-sm text-slate-600" />
              <YAxis type="category" dataKey="name" className="text-sm text-slate-600" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-4 text-sm text-slate-600">
            Total Allocated: {formatCurrency(totalAllocatedBudget)} | Total Spent: {formatCurrency(totalExpenses)}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Spending Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Monthly Spending</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlySpending} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="name" className="text-sm text-slate-600" />
                <YAxis tickFormatter={formatCurrency} className="text-sm text-slate-600" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#8884d8" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Income vs. Expense Chart */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Income vs. Expense</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeExpenseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                <XAxis dataKey="name" className="text-sm text-slate-600" />
                <YAxis tickFormatter={formatCurrency} className="text-sm text-slate-600" />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#82ca9d" name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ff7300" name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Spending by Category (Pie Chart) */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 lg:col-span-2">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categorySpending}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categorySpending.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Top Spending Categories List */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Top Spending Categories</h3>
              {spendingPatterns.length > 0 ? (
                <ul className="space-y-2">
                  {spendingPatterns.map((pattern, index) => (
                    <li key={pattern.category} className="flex items-center justify-between text-sm text-slate-600">
                      <span className="font-medium">{index + 1}. {pattern.category}</span>
                      <span>{formatCurrency(pattern.amount)} ({pattern.percentage}%)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm">No spending data to display yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 