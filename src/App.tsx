import React, { useState } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { AnalyticsPage } from './components/AnalyticsPage';
import { useBudgetData } from './hooks/useBudgetData';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { transactions, addTransaction } = useBudgetData();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:pl-64">
            <div className="max-w-7xl mx-auto px-4 py-8 pt-20 lg:pt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <TransactionForm onAddTransaction={addTransaction} onTransactionAdded={() => setActiveTab('transactions')} />
                </div>
                <div className="lg:col-span-2">
                  <TransactionList transactions={transactions} />
                </div>
              </div>
            </div>
          </div>
        );
      case 'goals':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:pl-64">
            <div className="max-w-7xl mx-auto px-4 py-8 pt-20 lg:pt-8">
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Goals Management</h2>
                <p className="text-slate-600">Advanced goal tracking and management features coming soon.</p>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 lg:pl-64">
            <div className="max-w-7xl mx-auto px-4 py-8 pt-20 lg:pt-8">
              <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Settings</h2>
                <p className="text-slate-600">User preferences and account settings coming soon.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={`${activeTab === 'dashboard' ? 'lg:pl-64' : ''} min-h-screen`}>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;