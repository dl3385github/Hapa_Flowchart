import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  HiOutlineHome,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineCog,
  HiOutlineQuestionMarkCircle,
  HiOutlineX,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
  HiOutlineChevronDown,
  HiOutlineChevronRight
} from 'react-icons/hi';

// Mock consul data - in a real app this would come from the API or Redux store
const mockConsuls = [
  {
    id: 'consul-1',
    name: 'Product Development',
  },
  {
    id: 'consul-2',
    name: 'Marketing Team',
  },
  {
    id: 'consul-3',
    name: 'Engineering',
  },
];

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [consulsExpanded, setConsulsExpanded] = useState(false);
  
  // Check if we're in a consul-related route
  useEffect(() => {
    if (location.pathname.includes('/consul/')) {
      setConsulsExpanded(true);
    }
  }, [location]);
  
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
      
      <nav className="mt-8 flex flex-col h-[calc(100vh-12rem)]">
        <ul className="flex-1 overflow-y-auto">
          <NavItem 
            to="/dashboard" 
            icon={<HiOutlineDocumentText />} 
            label={t('my_flowcharts')} 
            isCollapsed={!isOpen} 
          />
          
          <NavItem 
            to="/join" 
            icon={<HiOutlineUserAdd />} 
            label={t('join_flowchart')} 
            isCollapsed={!isOpen} 
          />
          
          <li>
            <button
              onClick={() => setConsulsExpanded(!consulsExpanded)}
              className={`w-full flex items-center px-4 py-3 transition-colors
                text-gray-300 hover:bg-gray-700
                ${location.pathname.includes('/consul/') ? 'bg-blue-700 text-white' : ''}`}
            >
              <span className="inline-block w-6 h-6">
                <HiOutlineUserGroup />
              </span>
              {isOpen && (
                <>
                  <span className="ml-3">{t('my_consuls')}</span>
                  <span className="text-gray-400">
                    {consulsExpanded ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
                  </span>
                </>
              )}
            </button>
            
            {consulsExpanded && isOpen && (
              <ul className="ml-12 mt-1 space-y-1">
                {mockConsuls.map(consul => (
                  <li key={consul.id}>
                    <NavLink
                      to={`/consul/${consul.id}`}
                      className={({ isActive }) => 
                        `block py-2 px-3 text-sm rounded-md transition-colors
                        ${isActive 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:bg-gray-700'}`
                      }
                    >
                      {consul.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </li>
          
          <NavItem 
            to="/tasks" 
            icon={<HiOutlineClipboardCheck />} 
            label={t('connect_to_task_manager')} 
            isCollapsed={!isOpen} 
          />
          
          <NavItem 
            to="/settings" 
            icon={<HiOutlineCog />} 
            label={t('settings')} 
            isCollapsed={!isOpen} 
          />
          
          <NavItem 
            to="/help" 
            icon={<HiOutlineQuestionMarkCircle />} 
            label={t('help')} 
            isCollapsed={!isOpen} 
          />
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