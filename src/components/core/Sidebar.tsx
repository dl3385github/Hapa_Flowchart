import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiOutlineX,
  HiOutlineUserAdd
} from 'react-icons/hi';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  
  return (
    <aside 
      className={`bg-gray-800 text-white w-64 min-h-screen flex-shrink-0 transition-all duration-300 ease-in-out 
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}`}
    >
      <div className="p-4 flex items-center justify-between">
        <h1 className={`font-bold text-xl ${!isOpen && 'md:hidden'}`}>
          {t('app_name')}
        </h1>
        <button className="md:hidden">
          <HiOutlineX className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="mt-8">
        <ul>
          <NavItem to="/dashboard" icon={<HiOutlineHome />} label={t('dashboard')} isCollapsed={!isOpen} />
          <NavItem to="/dashboard" icon={<HiOutlineDocumentText />} label={t('my_flowcharts')} isCollapsed={!isOpen} />
          <NavItem to="/join" icon={<HiOutlineUserAdd />} label={t('join_flowchart')} isCollapsed={!isOpen} />
          <NavItem to="/tasks" icon={<HiOutlineClipboardCheck />} label={t('connect_to_task_manager')} isCollapsed={!isOpen} />
          <NavItem to="/settings" icon={<HiOutlineCog />} label={t('settings')} isCollapsed={!isOpen} />
          <NavItem to="/help" icon={<HiOutlineQuestionMarkCircle />} label={t('help')} isCollapsed={!isOpen} />
        </ul>
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className={`text-sm text-gray-400 ${!isOpen && 'md:hidden'}`}>
          Hapa Flowchart v0.1.0
        </div>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isCollapsed }) => {
  return (
    <li>
      <NavLink 
        to={to}
        className={({ isActive }) => 
          `flex items-center px-4 py-3 transition-colors
          ${isActive ? 'bg-blue-700 text-white' : 'text-gray-300 hover:bg-gray-700'}`
        }
      >
        <span className="inline-block w-6 h-6">{icon}</span>
        {!isCollapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
};

export default Sidebar; 