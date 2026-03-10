import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ExpenseContext = createContext();

const API_URL = 'http://localhost:5000/api';

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpenses must be used within an ExpenseProvider');
  }
  return context;
};

export const ExpenseProvider = ({ children, userId }) => {
  const [data, setData] = useState({
    expenses: [],
    categories: [],
    budget: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'all',
    dateRange: 'all',
    search: ''
  });

  // Load data when userId changes
  const loadUserData = useCallback(async () => {
    try {
      // Fetch user data (budget and categories)
      const userDataRes = await fetch(`${API_URL}/user/${userId}/data`);
      if (!userDataRes.ok) {
        const text = await userDataRes.text();
        throw new Error(`loadUserData user data failed (${userDataRes.status}): ${text}`);
      }
      const userData = await userDataRes.json();

      // Fetch expenses
      const expensesRes = await fetch(`${API_URL}/expenses/${userId}`);
      if (!expensesRes.ok) {
        const text = await expensesRes.text();
        throw new Error(`loadUserData expenses failed (${expensesRes.status}): ${text}`);
      }
      const expenses = await expensesRes.json();

      setData({
        expenses,
        categories: userData.categories || [],
        budget: userData.budget || 0
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to default categories
      setData({
        expenses: [],
        categories: getDefaultCategories(),
        budget: 0
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      loadUserData();
    } else {
      setData({
        expenses: [],
        categories: [],
        budget: 0
      });
      setLoading(false);
    }
  }, [userId, loadUserData]);

  // Add expense
  const addExpense = useCallback(async (expense) => {
    try {
      const response = await fetch(`${API_URL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          description: expense.description,
          amount: parseFloat(expense.amount),
          categoryId: expense.categoryId,
          date: expense.date || new Date().toISOString()
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`addExpense failed (${response.status}): ${text}`);
      }
      const newExpense = await response.json();
      newExpense.id = newExpense._id;
      
      setData(prev => ({
        ...prev,
        expenses: [newExpense, ...prev.expenses]
      }));
      
      return newExpense;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }, [userId]);

  // Update expense
  const updateExpense = useCallback(async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: updates.description,
          amount: parseFloat(updates.amount),
          categoryId: updates.categoryId,
          date: updates.date
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`updateExpense failed (${response.status}): ${text}`);
      }

      const updatedExpense = await response.json();

      setData(prev => ({
        ...prev,
        expenses: prev.expenses.map(exp =>
          exp._id === id ? updatedExpense : exp
        )
      }));
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }, []);

  // Delete expense
  const deleteExpense = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/expenses/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`deleteExpense failed (${response.status}): ${text}`);
      }

      setData(prev => ({
        ...prev,
        expenses: prev.expenses.filter(exp => exp._id !== id)
      }));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }, []);

  // Add category
  const addCategory = useCallback(async (category) => {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: category.name,
          icon: category.icon,
          color: category.color
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`addCategory failed (${response.status}): ${text}`);
      }

      const categories = await response.json();
      
      setData(prev => ({
        ...prev,
        categories
      }));
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  }, [userId]);

  // Update category
  const updateCategory = useCallback(async (id, updates) => {
    try {
      const response = await fetch(`${API_URL}/categories/${userId}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: updates.name,
          icon: updates.icon,
          color: updates.color
        })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`updateCategory failed (${response.status}): ${text}`);
      }

      const categories = await response.json();
      
      setData(prev => ({
        ...prev,
        categories
      }));
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }, [userId]);

  // Delete category
  const deleteCategory = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/categories/${userId}/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`deleteCategory failed (${response.status}): ${text}`);
      }

      const categories = await response.json();
      
      setData(prev => ({
        ...prev,
        categories
      }));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }, [userId]);

  // Set budget
  const setBudget = useCallback(async (amount) => {
    try {
      const response = await fetch(`${API_URL}/user/${userId}/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budget: amount })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`setBudget failed (${response.status}): ${text}`);
      }

      setData(prev => ({
        ...prev,
        budget: amount
      }));
    } catch (error) {
      console.error('Error setting budget:', error);
      throw error;
    }
  }, [userId]);

  // Get filtered expenses
  const getFilteredExpenses = useCallback(() => {
    let filtered = [...data.expenses];

    // Filter by category
    if (filter.category !== 'all') {
      filtered = filtered.filter(exp => exp.categoryId === filter.category);
    }

    // Filter by date range
    const now = new Date();
    if (filter.dateRange === 'today') {
      filtered = filtered.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.toDateString() === now.toDateString();
      });
    } else if (filter.dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(exp => new Date(exp.date) >= weekAgo);
    } else if (filter.dateRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(exp => new Date(exp.date) >= monthStart);
    } else if (filter.dateRange === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(exp => new Date(exp.date) >= yearStart);
    }

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(exp =>
        exp.description.toLowerCase().includes(searchLower) ||
        exp.amount.toString().includes(searchLower)
      );
    }

    return filtered;
  }, [data.expenses, filter]);

  // Get expenses by category
  const getExpensesByCategory = useCallback(() => {
    const categoryTotals = {};
    data.expenses.forEach(exp => {
      if (categoryTotals[exp.categoryId]) {
        categoryTotals[exp.categoryId] += exp.amount;
      } else {
        categoryTotals[exp.categoryId] = exp.amount;
      }
    });
    return categoryTotals;
  }, [data.expenses]);

  // Get monthly expenses
  const getMonthlyExpenses = useCallback(() => {
    const monthlyTotals = {};
    data.expenses.forEach(exp => {
      const month = new Date(exp.date).toLocaleString('default', { month: 'short' });
      if (monthlyTotals[month]) {
        monthlyTotals[month] += exp.amount;
      } else {
        monthlyTotals[month] = exp.amount;
      }
    });
    return monthlyTotals;
  }, [data.expenses]);

  // Get total expenses
  const getTotalExpenses = useCallback(() => {
    return data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  }, [data.expenses]);

  // Get current month expenses
  const getCurrentMonthExpenses = useCallback(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return data.expenses
      .filter(exp => new Date(exp.date) >= monthStart)
      .reduce((sum, exp) => sum + exp.amount, 0);
  }, [data.expenses]);

  const value = {
    data,
    loading,
    filter,
    setFilter,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    deleteCategory,
    setBudget,
    getFilteredExpenses,
    getExpensesByCategory,
    getMonthlyExpenses,
    getTotalExpenses,
    getCurrentMonthExpenses
  };

  return (
    <ExpenseContext.Provider value={value}>
      {children}
    </ExpenseContext.Provider>
  );
};

// Default categories fallback
const getDefaultCategories = () => [
  { _id: '1', name: 'Food & Dining', icon: '🍔', color: '#FF6B6B' },
  { _id: '2', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { _id: '3', name: 'Shopping', icon: '🛒', color: '#45B7D1' },
  { _id: '4', name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { _id: '5', name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7' },
  { _id: '6', name: 'Health', icon: '💊', color: '#DDA0DD' },
  { _id: '7', name: 'Education', icon: '📚', color: '#98D8C8' },
  { _id: '8', name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { _id: '9', name: 'Other', icon: '📦', color: '#BDC3C7' },
];

