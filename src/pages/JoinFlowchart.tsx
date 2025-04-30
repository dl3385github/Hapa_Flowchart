import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { HiOutlineArrowLeft, HiOutlineKey } from 'react-icons/hi';
import { setActiveFlowchartKey } from '../store/slices/collaborationSlice';

const JoinFlowchart: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [hypercoreKey, setHypercoreKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleJoin = async () => {
    if (!hypercoreKey.trim()) {
      setError(t('please_enter_key'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we would validate the key and connect to the Hypercore network
      // For now, we'll just simulate it with a timeout
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set the active flowchart key in collaboration state
      dispatch(setActiveFlowchartKey(hypercoreKey));
      
      // Navigate to the editor page with a temporary ID
      // In a real implementation, we would load the actual flowchart data
      navigate(`/editor/shared-${hypercoreKey.substring(0, 8)}`);
    } catch (err) {
      setError(t('connection_failed'));
      console.error('Failed to join flowchart:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-xl mx-auto p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          title={t('go_back')}
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">{t('join_flowchart')}</h1>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('join_flowchart_instruction')}
          </p>
          
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('hypercore_key')}
          </label>
          
          <div className="flex">
            <div className="flex-shrink-0 inline-flex items-center px-3 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-l-md">
              <HiOutlineKey className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={hypercoreKey}
              onChange={(e) => setHypercoreKey(e.target.value)}
              placeholder={t('paste_hypercore_key')}
              className="form-input flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleJoin}
            disabled={isLoading || !hypercoreKey.trim()}
            className={`px-4 py-2 rounded-md ${
              isLoading || !hypercoreKey.trim()
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } transition-colors`}
          >
            {isLoading ? t('connecting') : t('join')}
          </button>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">{t('frequently_asked_questions')}</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('where_to_find_key')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('find_key_explanation')}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('connection_issues')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('connection_issues_explanation')}
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">{t('privacy_security')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('privacy_security_explanation')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinFlowchart; 