import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useExpenses } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/storage';
import './MonthlyChart.css';

const MonthlyChart = () => {
  const { getMonthlyExpenses } = useExpenses();
  
  const monthlyTotals = getMonthlyExpenses();
  
  // Get last 6 months
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toLocaleString('default', { month: 'short' });
    months.push({
      name: monthKey,
      amount: monthlyTotals[monthKey] || 0,
      fullDate: d
    });
  }

  return (
    <div className="monthly-chart-card">
      <h3>Monthly Spending Trend</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Spent']}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}
              cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }}
            />
            <Bar 
              dataKey="amount" 
              fill="url(#barGradient)" 
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="monthly-stats">
        <div className="stat">
          <span className="stat-label">Average</span>
          <span className="stat-value">
            {formatCurrency(months.reduce((sum, m) => sum + m.amount, 0) / months.length || 0)}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Highest</span>
          <span className="stat-value">
            {formatCurrency(Math.max(...months.map(m => m.amount)))}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Lowest</span>
          <span className="stat-value">
            {formatCurrency(Math.min(...months.filter(m => m.amount > 0).map(m => m.amount)) || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthlyChart;

