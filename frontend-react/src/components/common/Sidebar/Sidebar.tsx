import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/clientes', icon: 'fa-users', label: 'Clientes' },
    { path: '/cobranca', icon: 'fa-file-invoice-dollar', label: 'Cobrança' },
    { path: '/gestao', icon: 'fa-list-check', label: 'Gestão' },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="brand">
        <i className="fa-solid fa-layer-group"></i>
        {!isCollapsed && <span>PremiumSys</span>}
      </div>
      
      <button 
        className="toggle-btn" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        <i className={`fa-solid ${isCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
      </button>
      
      <nav className="nav-links">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={location.pathname === item.path ? 'active' : ''}
            title={isCollapsed ? item.label : ''}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
};
