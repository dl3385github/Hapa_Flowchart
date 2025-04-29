import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '../store';
import {
  setTheme,
  setAutosave,
  setAutoLayout,
  setSnapToGrid,
  setGridSize,
  setLanguage,
  resetSettings,
} from '../store/slices/settingsSlice';

const Settings: React.FC = () => {
  const settings = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (language: string) => {
    dispatch(setLanguage(language));
    i18n.changeLanguage(language);
    localStorage.setItem('hapaFlowchartLanguage', language);
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        {/* Theme Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-4">{t('theme')}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ThemeOption
              id="theme-light"
              label={t('light')}
              checked={settings.theme === 'light'}
              onChange={() => dispatch(setTheme('light'))}
            />
            
            <ThemeOption
              id="theme-dark"
              label={t('dark')}
              checked={settings.theme === 'dark'}
              onChange={() => dispatch(setTheme('dark'))}
            />
            
            <ThemeOption
              id="theme-system"
              label={t('system')}
              checked={settings.theme === 'system'}
              onChange={() => dispatch(setTheme('system'))}
            />
          </div>
        </div>
        
        {/* Language Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-4">{t('language')}</h2>
          
          <div className="w-full md:w-64">
            <select
              value={settings.language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="en">English</option>
              {/* Add more language options as needed */}
            </select>
          </div>
        </div>
        
        {/* Editor Settings */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-4">{t('editor_settings')}</h2>
          
          <div className="space-y-4">
            <SwitchSetting
              id="autosave"
              label={t('auto_save')}
              description={t('auto_save_description')}
              checked={settings.autosave}
              onChange={(checked) => dispatch(setAutosave(checked))}
            />
            
            <SwitchSetting
              id="autoLayout"
              label={t('auto_layout')}
              description={t('auto_layout_description')}
              checked={settings.autoLayout}
              onChange={(checked) => dispatch(setAutoLayout(checked))}
            />
            
            <SwitchSetting
              id="snapToGrid"
              label={t('snap_to_grid')}
              description={t('snap_to_grid_description')}
              checked={settings.snapToGrid}
              onChange={(checked) => dispatch(setSnapToGrid(checked))}
            />
            
            <div className="flex flex-col">
              <label htmlFor="gridSize" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('grid_size')}
              </label>
              <div className="flex items-center space-x-4">
                <input
                  id="gridSize"
                  type="range"
                  min="10"
                  max="50"
                  step="5"
                  value={settings.gridSize}
                  onChange={(e) => dispatch(setGridSize(Number(e.target.value)))}
                  className="w-full md:w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-md appearance-none"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-center">
                  {settings.gridSize}px
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Reset Settings */}
        <div className="p-6">
          <button
            onClick={() => {
              if (window.confirm(t('confirm_reset_settings'))) {
                dispatch(resetSettings());
              }
            }}
            className="px-4 py-2 border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20 transition-colors"
          >
            {t('reset_settings')}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ThemeOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({ id, label, checked, onChange }) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
        checked 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
          : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <input
        type="radio"
        id={id}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
      />
      <span className="ml-2 text-gray-700 dark:text-gray-200">{label}</span>
    </label>
  );
};

interface SwitchSettingProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SwitchSetting: React.FC<SwitchSettingProps> = ({ id, label, description, checked, onChange }) => {
  return (
    <div className="flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-700 dark:text-gray-200">
          {label}
        </label>
        {description && (
          <p className="text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
};

export default Settings; 