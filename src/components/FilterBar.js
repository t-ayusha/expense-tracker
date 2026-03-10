import React from 'react';
import { useExpenses } from '../context/ExpenseContext';
import './FilterBar.css';

const FilterBar = () => {
  const { data, filter, setFilter } = useExpenses();

  const handleFilterChange = (key, value) => {
    setFilter({ ...filter, [key]: value });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>🔍</label>
        <input
          type="text"
          placeholder="Search expenses..."
          value={filter.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-group">
        <label>📁</label>
        <select
          value={filter.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {data.categories.map(cat => (
            <option key={cat._id} value={cat._id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>
      
      <div className="filter-group">
        <label>📅</label>
        <select
          value={filter.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="filter-select"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      {(filter.search || filter.category !== 'all' || filter.dateRange !== 'all') && (
        <button 
          className="clear-filters-btn"
          onClick={() => setFilter({ category: 'all', dateRange: 'all', search: '' })}
        >
          ✕ Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;

