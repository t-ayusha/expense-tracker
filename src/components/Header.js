import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ activeTab, setActiveTab, onAddExpense }) => {
  const { currentUser, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    signOut();
    setShowUserMenu(false);
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1>💰 Expense Tracker</h1>
      </div>
      <nav className="header-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          📝 Expenses
        </button>
        <button 
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>
      <div className="header-right">
        <button className="add-expense-btn" onClick={onAddExpense}>
          + Add Expense
        </button>
        {currentUser && (
          <div className="user-menu-container">
            <button 
              className="user-menu-btn"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <span className="user-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </span>
              <span className="user-name">{currentUser.name || currentUser.email}</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserMenu && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <p className="user-email">{currentUser.email}</p>
                </div>
                <div className="user-menu-items">
                  <button onClick={handleSignOut}>
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

