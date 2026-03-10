import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency, formatDate } from '../utils/storage';
import './ExpenseList.css';

const ExpenseList = ({ onEdit }) => {
  const { data, getFilteredExpenses, deleteExpense } = useExpenses();
  const expenses = getFilteredExpenses();

  const getCategoryById = (categoryId) => {
    return data.categories.find(cat => cat._id === categoryId) || {};
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="expense-list-empty">
        <div className="empty-icon">📝</div>
        <h3>No expenses found</h3>
        <p>Start tracking your expenses by clicking the "Add Expense" button above!</p>
      </div>
    );
  }

  return (
    <div className="expense-list">
      <div className="expense-list-header">
        <h3>Recent Transactions</h3>
        <span className="expense-count">{expenses.length} transaction{expenses.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="expense-items">
        {expenses.map((expense) => {
          const category = getCategoryById(expense.categoryId);
          return (
            <div key={expense._id} className="expense-item">
              <div className="expense-icon" style={{ backgroundColor: category.color || '#ddd' }}>
                {category.icon || '📦'}
              </div>
              <div className="expense-details">
                <div className="expense-description">{expense.description}</div>
                <div className="expense-meta">
                  <span className="expense-category">{category.name || 'Uncategorized'}</span>
                  <span className="expense-date">{formatDate(expense.date)}</span>
                </div>
                {expense.notes && (
                  <div className="expense-notes">{expense.notes}</div>
                )}
              </div>
              <div className="expense-amount">
                -{formatCurrency(expense.amount)}
              </div>
              <div className="expense-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => onEdit(expense)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(expense._id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpenseList;

