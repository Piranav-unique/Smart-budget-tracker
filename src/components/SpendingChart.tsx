import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SpendingPattern } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SpendingChartProps {
  data: SpendingPattern[];
}

export const SpendingChart: React.FC<SpendingChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  const getTrendIcon = (trend: SpendingPattern['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable': return <Minus className="w-4 h-4 text-slate-500" />;
    }
  };

  const getTrendColor = (trend: SpendingPattern['trend']) => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      case 'stable': return 'text-slate-600';
    }
  };

  const categoryColors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500'
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-slate-800">{label}</p>
          <p className="text-sm text-blue-600">Amount: {formatCurrency(payload[0].value)}</p>
          <p className="text-sm text-slate-500">Percentage: {payload[0].payload.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const totalSpent = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalSpent)}</h3>
        <p className="text-slate-500">Total Spent</p>
      </div>

      {/* Donut Chart Visualization */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const radius = 35;
              const circumference = 2 * Math.PI * radius;
              const strokeDasharray = (item.percentage / 100) * circumference;
              const strokeDashoffset = -data.slice(0, index)
                .reduce((acc, curr) => acc + (curr.percentage / 100) * circumference, 0);
              
              return (
                <circle
                  key={item.category}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={categoryColors[index % categoryColors.length].replace('bg-', '')}
                  strokeWidth="8"
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:stroke-8"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">
                {formatCurrency(data.reduce((sum, item) => sum + item.amount, 0))}
              </div>
              <div className="text-sm text-slate-600">Total Spent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.category} className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${categoryColors[index % categoryColors.length]}`} />
            <p className="flex-1 text-slate-700">{item.category}</p>
            <p className="text-slate-700 font-semibold">{item.percentage}%</p>
            <p className="text-slate-500">{formatCurrency(item.amount)}</p>
            {getTrendIcon(item.trend)}
          </div>
        ))}
      </div>

      {/* Optional: Add a simple bar chart for visual spending patterns */}
      {data.length > 0 && (
        <div className="mt-8 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5, right: 30, left: 20, bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
              <XAxis dataKey="category" className="text-sm text-slate-600" />
              <YAxis tickFormatter={formatCurrency} className="text-sm text-slate-600" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};