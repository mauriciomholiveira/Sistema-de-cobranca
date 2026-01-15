import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

import { useAuth } from '../../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { signOut, user } = useAuth();
  const [schoolName, setSchoolName] = useState('Escola de Música');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Load school name from local storage or default
    const savedName = localStorage.getItem('premium_sys_school_name');
    if (savedName) setSchoolName(savedName);

    // Load theme from local storage
    const savedTheme = localStorage.getItem('premium_sys_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

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

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('premium_sys_theme', newTheme);
  };

  const menuItems = [
    { path: '/dashboard', icon: 'fa-chart-line', label: 'Dashboard' },
    { path: '/clientes', icon: 'fa-users', label: 'Clientes' },
    { path: '/cobranca', icon: 'fa-file-invoice-dollar', label: 'Cobrança' },
    { path: '/relatorios', icon: 'fa-chart-bar', label: 'Relatórios', adminOnly: true },
    { path: '/gestao', icon: 'fa-gear', label: 'Configurações', adminOnly: true },
  ];

  // Filter menu items based on admin status
  const visibleMenuItems = menuItems.filter(item => {
    if (item.adminOnly && !user?.is_admin) return false;
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
            <div className="school-info-header">
              <span className="school-label">
                {user?.is_admin ? 'Licenciado para:' : 'Professor:'}
              </span>
              <button 
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              >
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
            </div>
            <span className="school-name" title={user?.is_admin ? schoolName : user?.nome}>
              {user?.is_admin ? schoolName : user?.nome}
            </span>
          </div>
        )}
        
        {isCollapsed && (
          <button 
            className="theme-toggle-btn collapsed"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
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
