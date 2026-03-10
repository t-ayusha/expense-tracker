import React, { useState } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './AddExpenseModal.css';

const AddExpenseModal = ({ isOpen, onClose, editExpense = null }) => {
  const { data, addExpense, updateExpense } = useExpenses();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: data.categories[0]?._id || '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  React.useEffect(() => {
    if (editExpense) {
      setFormData({
        description: editExpense.description,
        amount: editExpense.amount.toString(),
        categoryId: editExpense.categoryId,
        date: editExpense.date.split('T')[0],
        notes: editExpense.notes || ''
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        categoryId: data.categories[0]?._id || '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
    }
  }, [editExpense, data.categories, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const expenseData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      date: formData.date,
      notes: formData.notes
    };

    try {
      if (editExpense) {
        await updateExpense(editExpense._id, expenseData);
      } else {
        await addExpense(expenseData);
      }
      onClose();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What did you spend on?"
              required
            />
          </div>
          <div className="form-group">
            <label>Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              required
            >
              {data.categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows="3"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              {editExpense ? 'Update' : 'Add'} Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;

