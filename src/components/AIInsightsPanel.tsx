import React from 'react';
import { AIInsight } from '../types';
import { Lightbulb, AlertTriangle, Trophy, TrendingUp, Sparkles } from 'lucide-react';

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ insights }) => {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'tip': return <Lightbulb className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'achievement': return <Trophy className="w-4 h-4" />;
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getInsightColors = (type: AIInsight['type']) => {
    switch (type) {
      case 'tip': return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800'
      };
      case 'warning': return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-800'
      };
      case 'achievement': return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'text-green-600',
        title: 'text-green-800'
      };
      case 'prediction': return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'text-purple-600',
        title: 'text-purple-800'
      };
      default: return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        icon: 'text-slate-600',
        title: 'text-slate-800'
      };
    }
  };

  return (
    <div className="space-y-4">
      {insights.map((insight) => {
        const colors = getInsightColors(insight.type);
        return (
          <div
            key={insight.id}
            className={`p-4 rounded-xl border-2 ${colors.bg} ${colors.border} hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-white ${colors.icon}`}>
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${colors.title} mb-1`}>
                  {insight.title}
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  {insight.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </span>
                    <div className="w-16 bg-slate-200 rounded-full h-1">
                      <div
                        className="h-1 bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${insight.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                  {insight.action && (
                    <button className={`text-xs font-medium ${colors.icon} hover:underline`}>
                      {insight.action}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};