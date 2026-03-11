import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/storage';
import './Dashboard.css';

const Dashboard = () => {
  const { data, getExpensesByCategory, getTotalExpenses, getCurrentMonthExpenses } = useExpenses();
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  
  const categoryTotals = getExpensesByCategory();
  const totalExpenses = getTotalExpenses();
  const currentMonthExpenses = getCurrentMonthExpenses();
  
  // Get current month expenses by category
  const getCurrentMonthExpensesByCategory = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const categoryTotals = {};
    
    data.expenses
      .filter(exp => new Date(exp.date) >= monthStart)
      .forEach(exp => {
        if (categoryTotals[exp.categoryId]) {
          categoryTotals[exp.categoryId] += exp.amount;
        } else {
          categoryTotals[exp.categoryId] = exp.amount;
        }
      });
    return categoryTotals;
  };
  
  const currentMonthCategoryTotals = getCurrentMonthExpensesByCategory();
  
  // Check for budget alerts
  useEffect(() => {
    const alerts = [];
    const { categoryBudgets } = data;
    
    if (categoryBudgets && Object.keys(categoryBudgets).length > 0) {
      data.categories.forEach(category => {
        const catBudget = categoryBudgets[category._id];
        if (catBudget && catBudget > 0) {
          const spent = currentMonthCategoryTotals[category._id] || 0;
          const percentage = (spent / catBudget) * 100;
          
          if (percentage >= 100) {
            alerts.push({
              type: 'over',
              category: category,
              message: `⚠️ ${category.name} is over budget! (${percentage.toFixed(1)}%)`,
              spent,
              budget: catBudget
            });
          } else if (percentage >= 90) {
            alerts.push({
              type: 'near',
              category: category,
              message: `🔔 ${category.name} is near budget limit (${percentage.toFixed(1)}%)`,
              spent,
              budget: catBudget
            });
          }
        }
      });
    }
    
    setBudgetAlerts(alerts);
  }, [data.categoryBudgets, data.categories, currentMonthCategoryTotals]);
  
  // Prepare data for pie chart
  const chartData = data.categories.map(category => ({
    name: category.name,
    value: categoryTotals[category._id] || 0,
    icon: category.icon,
    color: category.color
  })).filter(item => item.value > 0);

  const budget = data.budget || 0;
  const budgetPercentage = budget > 0 ? (currentMonthExpenses / budget) * 100 : 0;

  return (
    <div className="dashboard">
      {/* Budget Alerts Modal */}
      {budgetAlerts.length > 0 && (
        <div className="budget-alert-modal">
          <div className="budget-alert-content">
            <div className="budget-alert-header">
              <h3>⚠️ Budget Alerts</h3>
              <button className="close-alert" onClick={() => setBudgetAlerts([])}>×</button>
            </div>
            <div className="budget-alert-list">
              {budgetAlerts.map((alert, index) => (
                <div key={index} className={`budget-alert-item ${alert.type}`}>
                  <span className="alert-icon">{alert.type === 'over' ? '🚨' : '🔔'}</span>
                  <div className="alert-details">
                    <span className="alert-message">{alert.message}</span>
                    <span className="alert-amounts">
                      Spent: {formatCurrency(alert.spent)} / Budget: {formatCurrency(alert.budget)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Total Expenses</span>
            <span className="card-value">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
        
        <div className="summary-card month">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <span className="card-label">This Month</span>
            <span className="card-value">{formatCurrency(currentMonthExpenses)}</span>
          </div>
        </div>
        
        <div className="summary-card budget">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <span className="card-label">Budget</span>
            <span className="card-value">{formatCurrency(budget)}</span>
          </div>
        </div>
        
        <div className="summary-card count">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <span className="card-label">Transactions</span>
            <span className="card-value">{data.expenses.length}</span>
          </div>
        </div>
      </div>

      {/* Budget Progress */}
      {budget > 0 && (
        <div className="budget-progress-card">
          <div className="budget-header">
            <h3>Monthly Budget Progress</h3>
            <span className={`budget-status ${budgetPercentage > 100 ? 'over' : 'under'}`}>
              {budgetPercentage.toFixed(1)}% used
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className={`progress-fill ${budgetPercentage > 100 ? 'over-budget' : ''}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <div className="budget-details">
            <span>Spent: {formatCurrency(currentMonthExpenses)}</span>
            <span>Remaining: {formatCurrency(Math.max(0, budget - currentMonthExpenses))}</span>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Spending by Category</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">No expenses to display</div>
          )}
        </div>

        <div className="category-breakdown">
          <h3>Category Breakdown</h3>
          <div className="category-list">
            {chartData.length > 0 ? (
              [...chartData]
                .sort((a, b) => b.value - a.value)
                .map((item, index) => {
                  const category = data.categories.find(c => c.name === item.name);
                  const catBudget = category && data.categoryBudgets ? data.categoryBudgets[category._id] : 0;
                  const catSpent = currentMonthCategoryTotals[category?._id] || 0;
                  const catPercentage = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;
                  
                  return (
                    <div key={index} className="category-item">
                      <div className="category-info">
                        <span 
                          className="category-icon" 
                          style={{ backgroundColor: item.color }}
                        >
                          {item.icon}
                        </span>
                        <span className="category-name">{item.name}</span>
                      </div>
                      <div className="category-values">
                        <span className="category-amount">{formatCurrency(item.value)}</span>
                        <span className="category-percentage">
                          {totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : 0}%
                        </span>
                      </div>
                      {catBudget > 0 && (
                        <div className="category-budget-progress">
                          <div className="cat-progress-bar">
                            <div 
                              className={`cat-progress-fill ${catPercentage > 100 ? 'over-budget' : catPercentage >= 90 ? 'near-budget' : ''}`}
                              style={{ width: `${Math.min(catPercentage, 100)}%` }}
                            />
                          </div>
                          <span className={`cat-budget-status ${catPercentage > 100 ? 'over' : catPercentage >= 90 ? 'near' : ''}`}>
                            {catPercentage.toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
                <div className="no-data">No expenses recorded yet</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

