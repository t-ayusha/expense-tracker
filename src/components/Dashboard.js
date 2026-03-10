import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/storage';
import './Dashboard.css';

const Dashboard = () => {
  const { data, getExpensesByCategory, getTotalExpenses, getCurrentMonthExpenses } = useExpenses();
  
  const categoryTotals = getExpensesByCategory();
  const totalExpenses = getTotalExpenses();
  const currentMonthExpenses = getCurrentMonthExpenses();
  
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
            {chartData.length > 0 ? chartData
              .sort((a, b) => b.value - a.value)
              .map((item, index) => (
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
                </div>
              )).sort((a, b) => b.props.children[1].props.children[0].props.children - a.props.children[1].props.children[0].props.children)
              .map((item, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span 
                      className="category-icon" 
                      style={{ backgroundColor: chartData[index]?.color }}
                    >
                      {chartData[index]?.icon}
                    </span>
                    <span className="category-name">{chartData[index]?.name}</span>
                  </div>
                  <div className="category-values">
                    <span className="category-amount">{formatCurrency(chartData[index]?.value)}</span>
                    <span className="category-percentage">
                      {totalExpenses > 0 ? ((chartData[index]?.value / totalExpenses) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              )) : (
                <div className="no-data">No expenses recorded yet</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

