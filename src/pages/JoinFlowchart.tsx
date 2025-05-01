import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiOutlineArrowLeft, HiOutlineKey, HiOutlineRefresh } from 'react-icons/hi';
import { setActiveFlowchartKey } from '../store/slices/collaborationSlice';
import webRTCService from '../services/WebRTCService';
import { RootState } from '../store';

const JoinFlowchart: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [hypercoreKey, setHypercoreKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'retrying' | 'failed'>('idle');
  const { signalingError, isConnected } = useSelector((state: RootState) => state.collaboration);
  
  // Initialize WebRTC service
  useEffect(() => {
    const initService = async () => {
      try {
        await webRTCService.initialize();
        console.log('WebRTC service initialized successfully');
      } catch (err) {
        console.error('Failed to initialize WebRTC service:', err);
        setError(t('webrtc_initialization_failed'));
      }
    };
    
    initService();
    
    // Cleanup on unmount
    return () => {
      if (isLoading) {
        webRTCService.cleanup();
      }
    };
  }, [t]);
  
  // Update error from Redux state
  useEffect(() => {
    if (signalingError) {
      setError(signalingError);
      setIsLoading(false);
      setConnectionStatus('failed');
    }
  }, [signalingError]);
  
  // Watch connection status changes
  useEffect(() => {
    if (isConnected && (connectionStatus === 'connecting' || connectionStatus === 'retrying')) {
      // Connection successful
      console.log('Connection established successfully');
      setConnectionStatus('idle');
      setIsLoading(false);
      setError(null);
      
      // Navigate if we have a key set
      if (hypercoreKey) {
        // Create a temporary ID for the flowchart
        const tempId = `shared-${hypercoreKey.substring(0, 8)}`;
        
        // Navigate to the editor page with a temporary ID
        navigate(`/editor/${tempId}`);
      }
    }
  }, [isConnected, connectionStatus, hypercoreKey, navigate]);
  
  const handleJoin = async () => {
    if (!hypercoreKey.trim()) {
      setError(t('please_enter_key'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setConnectionStatus('connecting');
    
    try {
      console.log(`Attempting to join flowchart with key: ${hypercoreKey}`);
      
      // Attempt to join the flowchart using WebRTC service
      const success = await webRTCService.joinSharedFlowchart(hypercoreKey);
      
      if (success) {
        // Set the active flowchart key in collaboration state
        dispatch(setActiveFlowchartKey(hypercoreKey));
        
        // Navigation will happen in the useEffect when isConnected becomes true
        console.log('Join request successful, waiting for peer connections...');
        
        // Add a timeout in case the connection takes too long
        setTimeout(() => {
          if (connectionStatus === 'connecting' && !isConnected) {
            setError(t('connection_timeout'));
            setConnectionStatus('failed');
            setIsLoading(false);
          }
        }, 10000); // 10-second timeout
      } else {
        setError(t('connection_failed'));
        setConnectionStatus('failed');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t('connection_failed'));
      console.error('Failed to join flowchart:', err);
      setConnectionStatus('failed');
      setIsLoading(false);
    }
  };
  
  const handleRetry = async () => {
    if (!hypercoreKey.trim()) return;
    
    setConnectionStatus('retrying');
    setIsLoading(true);
    setError(null);
    
    // Clean up existing connections
    webRTCService.cleanup();
    
    // Reinitialize and try again
    try {
      await webRTCService.initialize();
      handleJoin();
    } catch (err) {
      console.error('Failed to reinitialize WebRTC service:', err);
      setError(t('webrtc_initialization_failed'));
      setConnectionStatus('failed');
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
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
              {connectionStatus === 'failed' && (
                <button
                  onClick={handleRetry}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  <HiOutlineRefresh className="h-4 w-4 mr-1" />
                  {t('retry')}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleJoin}
            disabled={isLoading || !hypercoreKey.trim()}
            className={`px-4 py-2 rounded-md transition-colors ${
              isLoading || !hypercoreKey.trim() 
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('connecting')}
              </span>
            ) : (
              t('join')
            )}
          </button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('join_flowchart_help')}
        </p>
      </div>
    </div>
  );
};

export default JoinFlowchart; 