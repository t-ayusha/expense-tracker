import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/storage';
import './Dashboard.css';

const Dashboard = () => {
  const { data, getExpensesByCategory, getTotalExpenses, getCurrentMonthExpenses } = useExpenses();
  const { user } = useAuth();
  const [showBudgetAlerts, setShowBudgetAlerts] = useState(false);
  const [budgetAlertsData, setBudgetAlertsData] = useState([]);
  const [showCategoryProgress, setShowCategoryProgress] = useState(false);
  const [selectedCategoryAlert, setSelectedCategoryAlert] = useState(null);
  
  const categoryTotals = getExpensesByCategory();
  const totalExpenses = getTotalExpenses();
  const currentMonthExpenses = getCurrentMonthExpenses();
  
  const currentMonthCategoryTotals = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const catTotals = {};
    data.expenses
      .filter(exp => new Date(exp.date) >= monthStart)
      .forEach(exp => {
        if (catTotals[exp.categoryId]) {
          catTotals[exp.categoryId] += exp.amount;
        } else {
          catTotals[exp.categoryId] = exp.amount;
        }
      });
    return catTotals;
  }, [data.expenses]);
  
  useEffect(() => {
    const alertsShown = localStorage.getItem('budgetAlertsShown');
    if (alertsShown) {
      return;
    }
    const { categoryBudgets } = data;
    const alerts = [];
    if (categoryBudgets && Object.keys(categoryBudgets).length > 0) {
      data.categories.forEach(category => {
        const catBudget = categoryBudgets[category._id];
        if (catBudget && catBudget > 0) {
          const spent = currentMonthCategoryTotals[category._id] || 0;
          const percentage = (spent / catBudget) * 100;
          if (percentage >= 100) {
            alerts.push({
              type: 'over',
              message: `Over budget: ${category.name} (${percentage.toFixed(1)}%)`,
              spent,
              budget: catBudget
            });
          } else if (percentage >= 90) {
            alerts.push({
              type: 'near',
              message: `Near budget: ${category.name} (${percentage.toFixed(1)}%)`,
              spent,
              budget: catBudget
            });
          }
        }
      });
    }
    if (alerts.length > 0) {
      setBudgetAlertsData(alerts);
      setShowBudgetAlerts(true);
      localStorage.setItem('budgetAlertsShown', 'true');
    }
  }, [data, currentMonthCategoryTotals]);
  
  const chartData = data.categories.map(category => ({
    name: category.name,
    value: categoryTotals[category._id] || 0,
    icon: category.icon,
    color: category.color
  })).filter(item => item.value > 0);

  const budget = data.budget || 0;
  const budgetPercentage = budget > 0 ? (currentMonthExpenses / budget) * 100 : 0;
  
// Auto-show popup EVERY Dashboard load/refresh if over budget (useEffect runs on mount)
  useEffect(() => {
    
    // Check if monthly budget is over
    if (budget > 0 && budgetPercentage >= 100) {
      setSelectedCategoryAlert({
        _id: 'monthly',
        name: 'Monthly Budget',
        icon: '🎯',
        color: '#f5576c',
        budget: budget,
        spent: currentMonthExpenses,
        percentage: budgetPercentage,
        type: 'over'
      });
      return;
    }
    
    // Check if any category is near or over budget
    const firstAlertCategory = data.categories.find(category => {
      const catBudget = data.categoryBudgets?.[category._id];
      if (!catBudget || catBudget <= 0) return false;
      const catSpent = currentMonthCategoryTotals[category._id] || 0;
      const catPercentage = (catSpent / catBudget) * 100;
      return catPercentage >= 90;
    });
    
    if (firstAlertCategory) {
      const catBudget = data.categoryBudgets[firstAlertCategory._id] || 0;
      const catSpent = currentMonthCategoryTotals[firstAlertCategory._id] || 0;
      const catPercentage = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;
      setSelectedCategoryAlert({
        ...firstAlertCategory,
        budget: catBudget,
        spent: catSpent,
        percentage: catPercentage,
        type: catPercentage >= 100 ? 'over' : 'near'
      });
    }
  }, [user, data.categoryBudgets, data.categories, currentMonthCategoryTotals, budget, budgetPercentage, currentMonthExpenses]);

  return (
    <div className="dashboard">
      {showBudgetAlerts && budgetAlertsData.length > 0 && (
        <div className="budget-alert-modal">
          <div className="budget-alert-content">
            <div className="budget-alert-header">
              <h3>Budget Alerts</h3>
              <button className="close-alert" onClick={() => setShowBudgetAlerts(false)}>x</button>
            </div>
            <div className="budget-alert-list">
              {budgetAlertsData.map((alert, index) => (
                <div key={index} className={`budget-alert-item ${alert.type}`}>
                  <span className="alert-icon">{alert.type === 'over' ? '🚨' : '⚠️'}</span>
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

      {selectedCategoryAlert && (
        <div className="budget-alert-modal" onClick={() => setSelectedCategoryAlert(null)}>
          <div className="budget-alert-content" onClick={(e) => e.stopPropagation()}>
            <div className="budget-alert-header">
              <h3>{selectedCategoryAlert.type === 'over' ? '🚨 Over Budget' : '⚠️ Near Budget'}</h3>
              <button className="close-alert" onClick={() => setSelectedCategoryAlert(null)}>x</button>
            </div>
            <div className="category-alert-detail">
              <div className="category-alert-icon" style={{ backgroundColor: selectedCategoryAlert.color }}>
                {selectedCategoryAlert.icon}
              </div>
              <h4>{selectedCategoryAlert.name}</h4>
              <div className="category-alert-progress">
                <div className="category-alert-progress-bar">
                  <div 
                    className={`category-alert-progress-fill ${selectedCategoryAlert.type === 'over' ? 'over-budget' : 'near-budget'}`}
                    style={{ width: `${Math.min(selectedCategoryAlert.percentage, 100)}%` }}
                  />
                </div>
                <span className={`category-alert-percent ${selectedCategoryAlert.type}`}>
                  {selectedCategoryAlert.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="category-alert-amounts">
                <div className="category-alert-amount">
                  <span>Spent</span>
                  <strong>{formatCurrency(selectedCategoryAlert.spent)}</strong>
                </div>
                <div className="category-alert-amount">
                  <span>Budget</span>
                  <strong>{formatCurrency(selectedCategoryAlert.budget)}</strong>
                </div>
                <div className="category-alert-amount">
                  <span>Remaining</span>
                  <strong className={selectedCategoryAlert.type}>
                    {formatCurrency(Math.max(0, selectedCategoryAlert.budget - selectedCategoryAlert.spent))}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
          
          {data.categoryBudgets && Object.keys(data.categoryBudgets).some(key => data.categoryBudgets[key] > 0) && (
            <>
              <button 
                className="toggle-category-progress"
                onClick={() => setShowCategoryProgress(!showCategoryProgress)}
              >
                {showCategoryProgress ? '▼ Hide' : '▶ Show'} Categories
              </button>
              
              {showCategoryProgress && (
                <div className="category-progress-in-card">
                  {data.categories
                    .filter(category => data.categoryBudgets[category._id] > 0)
                    .map(category => {
                      const catBudget = data.categoryBudgets[category._id] || 0;
                      const catSpent = currentMonthCategoryTotals[category._id] || 0;
                      const catPercentage = catBudget > 0 ? (catSpent / catBudget) * 100 : 0;
                      const isAlert = catPercentage >= 90;
                      return (
                        <div 
                          key={category._id} 
                          className={`category-progress-item ${isAlert ? 'clickable' : ''}`}
                          onClick={() => isAlert && setSelectedCategoryAlert({
                            ...category,
                            budget: catBudget,
                            spent: catSpent,
                            percentage: catPercentage,
                            type: catPercentage >= 100 ? 'over' : 'near'
                          })}
                        >
                          <div className="category-progress-info">
                            <span className="category-progress-icon" style={{ backgroundColor: category.color }}>
                              {category.icon}
                            </span>
                            <span className="category-progress-name">{category.name}</span>
                            <span className={`category-progress-percent ${catPercentage > 100 ? 'over' : catPercentage >= 90 ? 'near' : ''}`}>
                              {catPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="category-progress-bar">
                            <div 
                              className={`category-progress-fill ${catPercentage > 100 ? 'over-budget' : catPercentage >= 90 ? 'near-budget' : ''}`}
                              style={{ width: `${Math.min(catPercentage, 100)}%` }}
                            />
                          </div>
                          <div className="category-progress-amounts">
                            <span>{formatCurrency(catSpent)} / {formatCurrency(catBudget)}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}
        </div>
      )}

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
                        <span className="category-icon" style={{ backgroundColor: item.color }}>
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
console.log({budget: window.localStorage.getItem('expense_budget'), user: window.localStorage.getItem('expense_current_user'), categories: window.localStorage.getItem('expense_categories')})

export default Dashboard;

