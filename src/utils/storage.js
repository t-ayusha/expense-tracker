/// Utility functions for storage (using localStorage for browser compatibility)
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with autoTable
jsPDF.API.autoTable = autoTable;

// Get default categories
export const getDefaultCategories = () => [
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

// Get storage key for user-specific data
const getUserStorageKey = (userId) => `expenses_${userId}`;

// Load expenses for a specific user
export const loadUserExpenses = (userId) => {
  try {
    const key = getUserStorageKey(userId);
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default categories if no data
    const initialData = {
      expenses: [],
      categories: getDefaultCategories(),
      budget: 0
    };
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  } catch (error) {
    console.error('Error loading expenses:', error);
    return { expenses: [], categories: getDefaultCategories(), budget: 0 };
  }
};

// Save expenses for a specific user
export const saveUserExpenses = (userId, data) => {
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving expenses:', error);
    return false;
  }
};

// Load expenses (legacy function for backward compatibility)
export const loadExpenses = () => {
  const currentUser = JSON.parse(localStorage.getItem('expense_current_user'));
  if (currentUser) {
    return loadUserExpenses(currentUser._id);
  }
  return loadUserExpenses('default');
};

// Save expenses (legacy function for backward compatibility)
export const saveExpenses = (data) => {
  const currentUser = JSON.parse(localStorage.getItem('expense_current_user'));
  if (currentUser) {
    return saveUserExpenses(currentUser._id, data);
  }
  return saveUserExpenses('default', data);
};

// Export data to JSON file
export const exportToJSON = (data, options = {}) => {
  const { startDate = null, endDate = null } = options;
  
  // Generate date range string for filename
  let dateRangeStr = '';
  if (startDate && endDate) {
    dateRangeStr = `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    dateRangeStr = `_from_${startDate}`;
  } else if (endDate) {
    dateRangeStr = `_until_${endDate}`;
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses${dateRangeStr}_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export data to TXT file
export const exportToTXT = (data, options = {}) => {
  const { 
    startDate = null, 
    endDate = null, 
    categoryIds = [],
    includeCategories = true,
    includeBudget = true 
  } = options;

  let filteredExpenses = [...data.expenses];

  // Filter by date range
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(startDate));
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(endDate));
  }

  // Filter by categories
  if (categoryIds.length > 0) {
    filteredExpenses = filteredExpenses.filter(exp => categoryIds.includes(exp.categoryId));
  }

  // Sort by date (newest first)
  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Create category lookup
  const categoryMap = {};
  data.categories.forEach(cat => {
    categoryMap[cat._id] = cat;
  });

  // Build TXT content
  let content = '';
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  content += '='.repeat(50) + '\n';
  content += '         EXPENSE TRACKER REPORT\n';
  content += '='.repeat(50) + '\n';
  content += `Generated: ${date}\n`;
  
  // Show date range if filtering was applied
  if (startDate || endDate) {
    const startStr = startDate ? formatDate(startDate) : 'Beginning';
    const endStr = endDate ? formatDate(endDate) : 'Present';
    content += `Date Range: ${startStr} to ${endStr}\n`;
  }
  
  content += '='.repeat(50) + '\n\n';

  if (includeBudget && data.budget > 0) {
    content += `Monthly Budget: ${formatCurrency(data.budget)}\n`;
    const total = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    content += `Total Expenses: ${formatCurrency(total)}\n`;
    const remaining = data.budget - total;
    content += `Remaining Budget: ${formatCurrency(remaining)}\n`;
    content += '-'.repeat(50) + '\n\n';
  }

  content += `Total Expenses: ${filteredExpenses.length} item(s)\n`;
  content += `Total Amount: ${formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0))}\n\n`;
  content += '-'.repeat(50) + '\n';
  content += 'EXPENSE DETAILS\n';
  content += '-'.repeat(50) + '\n\n';

  if (filteredExpenses.length === 0) {
    content += 'No expenses found for the selected criteria.\n';
  } else {
    filteredExpenses.forEach((exp, index) => {
      const category = categoryMap[exp.categoryId];
      content += `${index + 1}. ${formatDate(exp.date)}\n`;
      content += `   Description: ${exp.description}\n`;
      content += `   Amount: ${formatCurrency(exp.amount)}\n`;
      if (includeCategories && category) {
        content += `   Category: ${category.icon} ${category.name}\n`;
      }
      content += '\n';
    });
  }

  content += '-'.repeat(50) + '\n';
  content += 'CATEGORY SUMMARY\n';
  content += '-'.repeat(50) + '\n\n';

  const categoryTotals = {};
  filteredExpenses.forEach(exp => {
    const catId = exp.categoryId;
    if (categoryTotals[catId]) {
      categoryTotals[catId] += exp.amount;
    } else {
      categoryTotals[catId] = exp.amount;
    }
  });

  Object.entries(categoryTotals).forEach(([catId, total]) => {
    const category = categoryMap[catId];
    if (category) {
      content += `${category.icon} ${category.name}: ${formatCurrency(total)}\n`;
    }
  });

  content += '\n' + '='.repeat(50) + '\n';
  content += 'End of Report\n';
  content += '='.repeat(50) + '\n';

  // Download as TXT
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Generate date range string for filename
  let dateRangeStr = '';
  if (startDate && endDate) {
    dateRangeStr = `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    dateRangeStr = `_from_${startDate}`;
  } else if (endDate) {
    dateRangeStr = `_until_${endDate}`;
  }
  
  link.download = `expenses${dateRangeStr}_${new Date().toISOString().split('T')[0]}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

// Export data to PDF file
export const exportToPDF = (data, options = {}) => {
  const { 
    startDate = null, 
    endDate = null, 
    categoryIds = [],
    includeCategories = true,
    includeBudget = true 
  } = options;

  let filteredExpenses = [...data.expenses];

  // Filter by date range
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(startDate));
  }
  if (endDate) {
    filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(endDate));
  }

  // Filter by categories
  if (categoryIds.length > 0) {
    filteredExpenses = filteredExpenses.filter(exp => categoryIds.includes(exp.categoryId));
  }

  // Sort by date (newest first)
  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Create category lookup
  const categoryMap = {};
  data.categories.forEach(cat => {
    categoryMap[cat._id] = cat;
  });

  const doc = new jsPDF();
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Title
  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Expense Tracker Report', 105, 20, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${date}`, 105, 28, { align: 'center' });

  // Date range if filtering was applied
  let yPos = 40;
  if (startDate || endDate) {
    const startStr = startDate ? formatDate(startDate) : 'Beginning';
    const endStr = endDate ? formatDate(endDate) : 'Present';
    const dateRangeText = `Date Range: ${startStr} to ${endStr}`;
    doc.text(dateRangeText, 105, 34, { align: 'center' });
    yPos = 45;
  }

  // Summary section
  doc.setFontSize(12);
  doc.setTextColor(0);

  doc.text(`Total Expenses: ${filteredExpenses.length} item(s)`, 14, yPos);
  yPos += 7;
  doc.text(`Total Amount: ${formatCurrency(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0))}`, 14, yPos);
  yPos += 15;

  // Expense details table
  if (filteredExpenses.length > 0) {
    const tableData = filteredExpenses.map(exp => {
      const category = categoryMap[exp.categoryId];
      return [
        formatDate(exp.date),
        exp.description,
        includeCategories ? (category ? ' ' + category.name : 'Uncategorized') : '-',
        formatCurrency(exp.amount)
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 50 },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { top: yPos }
    });

    yPos = doc.lastAutoTable.finalY + 15;
  } else {
    doc.text('No expenses found for the selected criteria.', 14, yPos);
    yPos += 15;
  }

  // Category summary
  doc.setFontSize(12);
  doc.text('Category Summary', 14, yPos);
  yPos += 8;

  const categoryTotals = {};
  filteredExpenses.forEach(exp => {
    const catId = exp.categoryId;
    if (categoryTotals[catId]) {
      categoryTotals[catId] += exp.amount;
    } else {
      categoryTotals[catId] = exp.amount;
    }
  });

  const categoryData = Object.entries(categoryTotals).map(([catId, total]) => {
    const category = categoryMap[catId];
    return [
      category ? category.name : 'Uncategorized',
      formatCurrency(total)
    ];
  });

  if (categoryData.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Total']],
      body: categoryData,
      theme: 'striped',
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 40, halign: 'right' }
      },
      margin: { top: yPos }
    });
  }

  // Save PDF
  // Generate date range string for filename
  let dateRangeStr = '';
  if (startDate && endDate) {
    dateRangeStr = `_${startDate}_to_${endDate}`;
  } else if (startDate) {
    dateRangeStr = `_from_${startDate}`;
  } else if (endDate) {
    dateRangeStr = `_until_${endDate}`;
  }
  
  doc.save(`expenses${dateRangeStr}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Import data from JSON file
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Format currency
export const formatCurrency = (amount) => {
  // Use 'en-IN' for Indian numbering system
  // Manually add Rupee symbol to avoid jsPDF font issues with Intl.NumberFormat currency
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `₹${formatted}`;
};

// Format date
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
};

// Get month name
export const getMonthName = (monthIndex) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex];
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

