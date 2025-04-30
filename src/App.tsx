import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from './store';
import { setTheme } from './store/slices/settingsSlice';

// Layout Components
import AppLayout from './components/core/AppLayout';

// Pages
import Dashboard from './pages/Dashboard';
import FlowchartEditor from './pages/FlowchartEditor';
import TaskIntegration from './pages/TaskIntegration';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import JoinFlowchart from './pages/JoinFlowchart';

// Styles
import './styles/index.css';

const App: React.FC = () => {
  const { theme } = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  
  // Apply theme on load and change
  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      }
    };
    
    applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);
  
  // Set language
  useEffect(() => {
    const savedLanguage = localStorage.getItem('hapaFlowchartLanguage');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);
  
  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="editor/:id" element={<FlowchartEditor />} />
          <Route path="join" element={<JoinFlowchart />} />
          <Route path="tasks" element={<TaskIntegration />} />
          <Route path="settings" element={<Settings />} />
          <Route path="consul/:id" element={<Dashboard consulView={true} />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App; 