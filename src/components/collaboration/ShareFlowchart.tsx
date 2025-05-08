import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { 
  HiOutlineClipboard, 
  HiOutlineClipboardCheck, 
  HiOutlineShare, 
  HiOutlineUserGroup
} from 'react-icons/hi';
import { RootState } from '../../store';
import { p2pService } from '../../services';

interface ShareFlowchartProps {
  flowchartId: string;
}

const ShareFlowchart: React.FC<ShareFlowchartProps> = ({ flowchartId }) => {
  const { t } = useTranslation();
  const [flowchartKey, setFlowchartKey] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const activeFlowchartKey = useSelector((state: RootState) => state.collaboration.activeFlowchartKey);
  const isConnected = useSelector((state: RootState) => state.collaboration.isConnected);
  const peers = useSelector((state: RootState) => state.collaboration.peers);
  const peerCount = Object.keys(peers).length;
  
  // Check if we already have a key for this flowchart
  useEffect(() => {
    const checkExistingKey = async () => {
      const existingKey = p2pService.getFlowchartKey(flowchartId);
      if (existingKey) {
        setFlowchartKey(existingKey);
        if (activeFlowchartKey === existingKey) {
          setIsSharing(true);
        }
      }
    };
    
    checkExistingKey();
  }, [flowchartId, activeFlowchartKey]);
  
  const handleStartSharing = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First initialize the P2P service
      await p2pService.initialize();
      
      // Create a shareable flowchart
      const key = await p2pService.createSharedFlowchart(flowchartId);
      setFlowchartKey(key);
      setIsSharing(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to start sharing:', err);
      setError(err.message || t('sharing_failed'));
      setIsLoading(false);
    }
  };
  
  const handleStopSharing = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clean up P2P connections
      await p2pService.cleanup();
      setIsSharing(false);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Failed to stop sharing:', err);
      setError(err.message || t('stop_sharing_failed'));
      setIsLoading(false);
    }
  };
  
  const handleCopyKey = () => {
    if (!flowchartKey) return;
    
    navigator.clipboard.writeText(flowchartKey).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy key:', err);
      setError(t('copy_failed'));
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <h2 className="text-lg font-semibold flex items-center mb-3">
        <HiOutlineShare className="w-5 h-5 mr-2" />
        {t('share_flowchart')}
      </h2>
      
      {!isSharing ? (
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {t('share_flowchart_description')}
          </p>
          
          <button
            onClick={handleStartSharing}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-md transition-colors ${
              isLoading 
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('starting')}
              </span>
            ) : (
              t('start_sharing')
            )}
          </button>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('flowchart_key')}:
            </span>
            
            <div className="flex items-center text-sm">
              <span className="text-green-600 dark:text-green-400 flex items-center mr-2">
                <HiOutlineUserGroup className="w-4 h-4 mr-1" />
                {peerCount} {peerCount === 1 ? t('peer') : t('peers')}
              </span>
              <span className={`flex items-center ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isConnected ? t('connected') : t('disconnected')}
              </span>
            </div>
          </div>
          
          <div className="flex mb-4">
            <input
              type="text"
              value={flowchartKey || ''}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={handleCopyKey}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 border-l-0 rounded-r-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              title={t('copy_to_clipboard')}
            >
              {isCopied ? (
                <HiOutlineClipboardCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <HiOutlineClipboard className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('share_key_instructions')}
          </p>
          
          <button
            onClick={handleStopSharing}
            disabled={isLoading}
            className={`w-full px-4 py-2 rounded-md border transition-colors ${
              isLoading 
                ? 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'border-red-300 dark:border-red-800 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {isLoading ? t('stopping') : t('stop_sharing')}
          </button>
        </div>
      )}
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default ShareFlowchart; 