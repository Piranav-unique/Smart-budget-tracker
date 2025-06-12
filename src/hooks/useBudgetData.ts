import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Budget, Goal, AIInsight, SpendingPattern } from '../types';

// Mock data initialization - these can be removed or made dynamic later if needed
const initialMockBudgets: Omit<Budget, 'spent'>[] = [
  { id: '1', category: 'Food', allocated: 500, period: 'monthly' },
  { id: '2', category: 'Entertainment', allocated: 200, period: 'monthly' },
  { id: '3', category: 'Transportation', allocated: 300, period: 'monthly' },
  { id: '4', category: 'Education', allocated: 400, period: 'monthly' },
  { id: '5', category: 'Healthcare', allocated: 150, period: 'monthly' },
  { id: '6', category: 'Shopping', allocated: 250, period: 'monthly' },
  { id: '7', category: 'Utilities', allocated: 100, period: 'monthly' },
  { id: '8', category: 'Income', allocated: 0, period: 'monthly' }, // Income budget usually isn't 'spent'
  { id: '9', category: 'Other', allocated: 100, period: 'monthly' }
];

export const useBudgetData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  // Effect to fetch transactions and budgets (runs once)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions
        const transactionsResponse = await fetch('http://localhost:8000/transactions/');
        if (!transactionsResponse.ok) {
          throw new Error(`HTTP error! status: ${transactionsResponse.status}`);
        }
        const transactionsData: Transaction[] = await transactionsResponse.json();
        setTransactions(transactionsData);

        // Fetch budgets
        const budgetsResponse = await fetch('http://localhost:8000/budgets/');
        if (!budgetsResponse.ok) {
          throw new Error(`HTTP error! status: ${budgetsResponse.status}`);
        }
        const budgetsData: Budget[] = await budgetsResponse.json();
        setBudgets(budgetsData);

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Set mock goals (can be replaced with API call later)
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Emergency Fund',
        targetAmount: 1000,
        currentAmount: 450,
        deadline: '2024-06-30',
        category: 'Savings',
        priority: 'high'
      },
      {
        id: '2',
        title: 'New Laptop',
        targetAmount: 800,
        currentAmount: 220,
        deadline: '2024-08-15',
        category: 'Technology',
        priority: 'medium'
      }
    ];
    setGoals(mockGoals);

  }, []); // Run only once on component mount

  // Derived state: calculate spent amounts for budgets using useMemo
  const budgetsWithSpent: Budget[] = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...budget, spent: parseFloat(spent.toFixed(2)) };
    });
  }, [transactions, budgets]);

  // Effect to fetch AI insights dynamically
  useEffect(() => {
    const fetchAIInsights = async () => {
      try {
        const response = await fetch('http://localhost:8000/generate_insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            transactions: transactions.map(t => ({ // Map to TransactionBase for backend
              amount: t.amount,
              category: t.category,
              description: t.description,
              date: t.date,
              type: t.type,
              recurring: t.recurring,
              tags: t.tags
            })),
            budgets: budgetsWithSpent.map(b => ({ // Map to BudgetBase for backend
              category: b.category,
              allocated: b.allocated,
              spent: b.spent
            }))
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AIInsight[] = await response.json();
        setInsights(data);
      } catch (error) {
        console.error("Error fetching AI insights:", error);
        // Fallback to empty insights or show an error message
        setInsights([]);
      }
    };

    // Only fetch insights if there's enough data to send
    if (transactions.length > 0 || budgetsWithSpent.length > 0) {
      fetchAIInsights();
    }
  }, [transactions, budgetsWithSpent]); // Re-fetch insights when transactions or calculated budgets change

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'tags' | 'recurring' | 'type'> & {tags: string, recurring: boolean, type: 'income' | 'expense'}) => {
    try {
      const response = await fetch('http://localhost:8000/transactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newTransaction: Transaction = await response.json();
      setTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  const updateBudgets = async (updatedBudgets: Budget[]) => {
    try {
      // Update each budget in the backend
      for (const budget of updatedBudgets) {
        const response = await fetch(`http://localhost:8000/budgets/${budget.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: budget.category,
            allocated: budget.allocated,
            spent: budget.spent
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // After all updates are successful, update the local state
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error("Error updating budgets:", error);
      // You might want to show an error message to the user here
    }
  };

  const addBudget = async (budget: Omit<Budget, 'id' | 'spent'>) => {
    try {
      const response = await fetch('http://localhost:8000/budgets/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...budget,
          spent: 0
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newBudget: Budget = await response.json();
      setBudgets(prev => [...prev, newBudget]);
    } catch (error) {
      console.error("Error adding budget:", error);
    }
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    const newGoal = {
      ...goal,
      id: Date.now().toString()
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const totalIncome = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = React.useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = React.useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const spendingPatterns = React.useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpensesAmount = expenses.reduce((sum, t) => sum + t.amount, 0);

    const categorySpending: { [key: string]: number } = {};
    expenses.forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const patterns: SpendingPattern[] = Object.entries(categorySpending).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2)),
      percentage: parseFloat(((amount / totalExpensesAmount) * 100).toFixed(0)),
      trend: 'stable' // Placeholder for now, as historical data is not available
    }));

    // Sort by amount descending
    patterns.sort((a, b) => b.amount - a.amount);

    return patterns;
  }, [transactions]);

  return {
    transactions,
    budgets: budgetsWithSpent,
    goals,
    insights,
    spendingPatterns,
    totalIncome,
    totalExpenses,
    netBalance,
    addTransaction,
    addBudget,
    updateBudgets,
    addGoal,
    setBudgets: updateBudgets
  };
};