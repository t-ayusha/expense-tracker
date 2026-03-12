import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../context/ExpenseContext';
import { exportToJSON, exportToTXT, exportToPDF, importFromJSON, formatCurrency } from '../utils/storage';
import './Settings.css';

const Settings = () => {
  const { data, setBudget, setCategoryBudget, addCategory, deleteCategory, updateCategory } = useExpenses();
  const [newCategory, setNewCategory] = useState({ name: '', icon: '📦', color: '#BDC3C7' });
  const [budgetInput, setBudgetInput] = useState(data.budget || '');
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategoryBudget, setEditingCategoryBudget] = useState(null);
  const [categoryBudgetInput, setCategoryBudgetInput] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'json',
    startDate: '',
    endDate: '',
    categoryIds: [],
    includeCategories: true,
    includeBudget: true
  });
  const fileInputRef = useRef(null);

  // Initialize category budgets from data
  useEffect(() => {
    if (data.categoryBudgets) {
      setCategoryBudgets(data.categoryBudgets);
    }
  }, [data.categoryBudgets]);

  const handleBudgetSave = async () => {
    const budget = parseFloat(budgetInput) || 0;
    try {
      await setBudget(budget);
      alert(`Budget set to ${formatCurrency(budget)}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleCategoryBudgetSave = async (categoryId) => {
    const amount = parseFloat(categoryBudgetInput) || 0;
    try {
      await setCategoryBudget(categoryId, amount);
      setCategoryBudgets(prev => ({ ...prev, [categoryId]: amount }));
      setEditingCategoryBudget(null);
      setCategoryBudgetInput('');
      alert(`Category budget set to ${formatCurrency(amount)}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleEditCategoryBudget = (category) => {
    setEditingCategoryBudget(category._id);
    setCategoryBudgetInput(categoryBudgets[category._id] || '');
  };

  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExport = () => {
    const options = {
      startDate: exportOptions.startDate || null,
      endDate: exportOptions.endDate || null,
      categoryIds: exportOptions.categoryIds,
      includeCategories: exportOptions.includeCategories,
      includeBudget: exportOptions.includeBudget
    };

    switch (exportOptions.format) {
      case 'json':
        exportToJSON(data, options);
        break;
      case 'txt':
        exportToTXT(data, options);
        break;
      case 'pdf':
        exportToPDF(data, options);
        break;
      default:
        exportToJSON(data, options);
    }
    setShowExportModal(false);
  };

  const handleCategoryToggle = (categoryId) => {
    setExportOptions(prev => {
      const ids = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(_id => _id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds: ids };
    });
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const importedData = await importFromJSON(file);
        if (importedData && importedData.expenses) {
          // Save to current user's storage
          localStorage.setItem(`expenses_${localStorage.getItem('expense_current_user')?._id || 'default'}`, JSON.stringify(importedData));
          window.location.reload();
        } else {
          alert('Invalid file format');
        }
      } catch (error) {
        alert('Failed to import file');
      }
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        await addCategory(newCategory);
        setNewCategory({ name: '', icon: '📦', color: '#BDC3C7' });
        setShowAddCategory(false);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const handleDeleteCategory = async (_id) => {
    if (window.confirm('Are you sure you want to delete this category? Expenses in this category will become uncategorized.')) {
      try {
        await deleteCategory(_id);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      try {
        await updateCategory(editingCategory._id, editingCategory);
        setEditingCategory(null);
      } catch (error) {
        alert('Error: ' + error.message);
      }
    }
  };

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BDC3C7', '#E74C3C',
    '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'
  ];

  const icons = ['🍔', '🚗', '🛒', '🎬', '💡', '💊', '📚', '✈️', '📦', '🏠', '👕', '🎮', '💰', '🎁', '🏋️', '🚌'];

  return (
    <div className="settings">
      <h2>Settings</h2>

      {/* Budget Section */}
      <div className="settings-section">
        <h3>💰 Monthly Budget</h3>
        <div className="budget-input-group">
          <input
            type="number"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
            placeholder="Enter your monthly budget"
            min="0"
            step="0.01"
          />
          <button onClick={handleBudgetSave}>Set Budget</button>
        </div>
        <p className="section-description">
          Set a monthly budget to track your spending progress
        </p>
      </div>

      {/* Categories Section */}
      <div className="settings-section">
        <div className="section-header">
          <h3>📁 Categories</h3>
          <button 
            className="add-category-btn"
            onClick={() => setShowAddCategory(!showAddCategory)}
          >
            {showAddCategory ? 'Cancel' : '+ Add Category'}
          </button>
        </div>

        {showAddCategory && (
          <div className="add-category-form">
            <input
              type="text"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              placeholder="Category name"
            />
            <div className="color-picker">
              <span>Color:</span>
              <div className="color-options">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`color-option ${newCategory.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewCategory({ ...newCategory, color })}
                  />
                ))}
              </div>
            </div>
            <div className="icon-picker">
              <span>Icon:</span>
              <div className="icon-options">
                {icons.map(icon => (
                  <button
                    key={icon}
                    className={`icon-option ${newCategory.icon === icon ? 'selected' : ''}`}
                    onClick={() => setNewCategory({ ...newCategory, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <button className="save-category-btn" onClick={handleAddCategory}>
              Save Category
            </button>
          </div>
        )}

        <div className="categories-list">
          {data.categories.map(category => (
            <div key={category._id} className="category-row">
              {editingCategory?._id === category._id ? (
                <div className="edit-category-form">
                  <input
                    type="text"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                  <button onClick={handleUpdateCategory}>Save</button>
                  <button onClick={() => setEditingCategory(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="category-info">
                    <span 
                      className="category-badge"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </span>
                    <span className="category-name">{category.name}</span>
                    {editingCategoryBudget === category._id ? (
                      <div className="category-budget-edit">
                        <input
                          type="number"
                          value={categoryBudgetInput}
                          onChange={(e) => setCategoryBudgetInput(e.target.value)}
                          placeholder="Budget"
                          min="0"
                          step="0.01"
                        />
                        <button onClick={() => handleCategoryBudgetSave(category._id)}>✓</button>
                        <button onClick={() => setEditingCategoryBudget(null)}>✕</button>
                      </div>
                    ) : (
                      <button className="category-budget-btn" onClick={() => handleEditCategoryBudget(category)}>
                        {categoryBudgets[category._id] > 0 
                          ? `${formatCurrency(categoryBudgets[category._id])}` 
                          : 'Set Budget'
                        }
                      </button>
                    )}
                  </div>
                  <div className="category-actions">
                    <button 
                      className="edit-category-btn"
                      onClick={() => setEditingCategory(category)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-category-btn"
                      onClick={() => handleDeleteCategory(category._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Data Management Section */}
      <div className="settings-section">
        <h3>💾 Data Management</h3>
        <div className="data-buttons">
          <button className="export-btn" onClick={handleExportClick}>
            📤 Export Data
          </button>
          <button 
            className="import-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📥 Import Data
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            style={{ display: 'none' }}
          />
        </div>
        <p className="section-description">
          Export your data in various formats (JSON, TXT, PDF) with filtering options, or import from a previously exported file.
        </p>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="export-modal" onClick={e => e.stopPropagation()}>
            <div className="export-modal-header">
              <h3>📤 Export Data</h3>
              <button className="close-modal" onClick={() => setShowExportModal(false)}>×</button>
            </div>
            
            <div className="export-modal-body">
              <div className="export-section">
                <label>Export Format:</label>
                <div className="format-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={exportOptions.format === 'json'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                    />
                    <span>📄 JSON</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="format"
                      value="txt"
                      checked={exportOptions.format === 'txt'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                    />
                    <span>📝 TXT</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportOptions.format === 'pdf'}
                      onChange={(e) => setExportOptions({ ...exportOptions, format: e.target.value })}
                    />
                    <span>📕 PDF</span>
                  </label>
                </div>
              </div>

              {(exportOptions.format === 'txt' || exportOptions.format === 'pdf') && (
                <>
                  <div className="export-section">
                    <label>Date Range (Optional):</label>
                    <div className="date-range">
                      <input
                        type="date"
                        value={exportOptions.startDate}
                        onChange={(e) => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                        placeholder="Start Date"
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={exportOptions.endDate}
                        onChange={(e) => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                        placeholder="End Date"
                      />
                    </div>
                  </div>

                  <div className="export-section">
                    <label>Filter by Categories (Optional):</label>
                    <div className="category-filters">
                      {data.categories.map(cat => (
                        <label key={cat._id} className="checkbox-option">
                          <input
                            type="checkbox"
                            checked={exportOptions.categoryIds.includes(cat._id)}
                            onChange={() => handleCategoryToggle(cat._id)}
                          />
                          <span>{cat.icon} {cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="export-section">
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeCategories}
                        onChange={(e) => setExportOptions({ ...exportOptions, includeCategories: e.target.checked })}
                      />
                      <span>Include Category Details</span>
                    </label>
                    <label className="checkbox-option">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeBudget}
                        onChange={(e) => setExportOptions({ ...exportOptions, includeBudget: e.target.checked })}
                      />
                      <span>Include Budget Summary</span>
                    </label>
                  </div>
                </>
              )}
            </div>

            <div className="export-modal-footer">
              <button className="cancel-btn" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="export-confirm-btn" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="settings-section">
        <h3>ℹ️ About</h3>
        <div className="about-info">
          <p><strong>Expense Tracker</strong></p>
          <p>Version 1.0.0</p>
          <p>A simple and beautiful expense tracking application to help you manage your finances.</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;

