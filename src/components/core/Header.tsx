import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { 
  HiOutlineMenu, 
  HiOutlineSun, 
  HiOutlineMoon, 
  HiOutlineShare,
  HiOutlineUserCircle
} from 'react-icons/hi';
import { RootState } from '../../store';

interface HeaderProps {
  title: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  isSidebarOpen, 
  onToggleSidebar 
}) => {
  const { theme } = useSelector((state: RootState) => state.settings);
  const { isConnected, peers } = useSelector((state: RootState) => state.collaboration);
  const { t } = useTranslation();
  
  const peerCount = Object.keys(peers).length;
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm h-16 flex items-center px-4">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
      >
        <HiOutlineMenu className="h-6 w-6" />
      </button>
      
      <h1 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>
      
      <div className="ml-auto flex items-center space-x-4">
        {/* Collaboration Status */}
        {isConnected && (
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600 dark:text-gray-300 mr-1">
              {peerCount > 0 ? t('active_collaborators') : t('connected')}:
            </span>
            <span className="font-medium">{peerCount}</span>
          </div>
        )}
        
        {/* Share Button */}
        <button
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          title={t('share')}
        >
          <HiOutlineShare className="h-5 w-5" />
        </button>
        
        {/* Theme Toggle */}
        <button
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          title={theme === 'dark' ? t('switch_to_light') : t('switch_to_dark')}
        >
          {theme === 'dark' ? (
            <HiOutlineSun className="h-5 w-5" />
          ) : (
            <HiOutlineMoon className="h-5 w-5" />
          )}
        </button>
        
        {/* User Profile */}
        <button
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          title={t('profile')}
        >
          <HiOutlineUserCircle className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
};

export default Header; 