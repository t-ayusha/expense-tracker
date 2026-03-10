import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import FilterBar from './components/FilterBar';
import AddExpenseModal from './components/AddExpenseModal';
import MonthlyChart from './components/MonthlyChart';
import Settings from './components/Settings';
import Login from './components/Login';
import './App.css';

function AppContent() {
  const { currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!currentUser) {
    return <Login />;
  }

  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="dashboard-view">
            <Dashboard />
            <MonthlyChart />
          </div>
        );
      case 'expenses':
        return (
          <div className="expenses-view">
            <FilterBar />
            <ExpenseList onEdit={handleEditExpense} />
          </div>
        );
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ExpenseProvider userId={currentUser.id}>
      <div className="app">
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onAddExpense={handleAddExpense}
        />
        <main className="main-content">
          {renderContent()}
        </main>
        <AddExpenseModal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          editExpense={editingExpense}
        />
      </div>
    </ExpenseProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

