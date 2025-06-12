export interface Transaction {
  id: number | null;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'income' | 'expense';
  recurring: boolean;
  tags: string | null;
}

export interface Budget {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AIInsight {
  id: string;
  type: 'warning' | 'tip' | 'achievement' | 'prediction';
  title: string;
  description: string;
  action?: string;
  confidence: number;
}

export interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}