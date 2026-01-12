import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

import { useAuth } from '../../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const [schoolName, setSchoolName] = useState('Escola de Música');

  React.useEffect(() => {
    // Load school name from local storage or default
    const savedName = localStorage.getItem('premium_sys_school_name');
    if (savedName) setSchoolName(savedName);

    // Listen for storage events to update real-time
    const handleStorageChange = () => {
      const newName = localStorage.getItem('premium_sys_school_name');
      if (newName) setSchoolName(newName);
    };

    window.addEventListener('storage', handleStorageChange);
    // Custom event for same-window updates
    window.addEventListener('school_name_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('school_name_updated', handleStorageChange);
    };
  }, []);

  const menuItems = [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/clientes', icon: 'fa-users', label: 'Clientes' },
    { path: '/cobranca', icon: 'fa-file-invoice-dollar', label: 'Cobrança' },
    { path: '/gestao', icon: 'fa-gear', label: 'Configurações' },
  ];

  // Filter out Gestao if not admin
  const visibleMenuItems = menuItems.filter(item => {
    if (item.path === '/gestao' && !user?.is_admin) return false;
    return true;
  });

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
        {visibleMenuItems.map((item) => (
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

      <div className="sidebar-footer">
        {!isCollapsed && (
          <div className="school-info">
            <span className="school-label">
              {user?.is_admin ? 'Licenciado para:' : 'Professor:'}
            </span>
            <span className="school-name" title={user?.is_admin ? schoolName : user?.nome}>
              {user?.is_admin ? schoolName : user?.nome}
            </span>
          </div>
        )}
        
        <button 
          onClick={signOut} 
          className="logout-btn"
          title={isCollapsed ? 'Sair' : ''}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};
