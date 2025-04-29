import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store';
import { toggleSidebar } from '../../store/slices/uiSlice';

// Components
import Sidebar from './Sidebar';
import Header from './Header';

const AppLayout: React.FC = () => {
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={t('app_name')} 
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        
        <main className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout; 