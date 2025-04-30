import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlineUsers, HiOutlineX } from 'react-icons/hi';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';

interface CollaboratorsListProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { peers, localPeerId } = useSelector((state: RootState) => state.collaboration);
  
  // Add the current user to the list
  const allUsers = [
    {
      peerId: localPeerId || 'local-user',
      name: t('you'),
      isOnline: true,
      isCurrentUser: true,
      lastSeen: new Date().toISOString(),
    },
    ...(Object.values(peers).map(peer => ({
      peerId: peer.peerId,
      name: peer.name || peer.peerId.substring(0, 8),
      isOnline: true,
      isCurrentUser: false,
      lastSeen: peer.lastSeen,
    }))),
  ];
  
  // Format last seen time
  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) {
      return t('just_now');
    } else if (diffMinutes < 60) {
      return t('minutes_ago', { count: diffMinutes });
    } else if (diffMinutes < 24 * 60) {
      const hours = Math.floor(diffMinutes / 60);
      return t('hours_ago', { count: hours });
    } else {
      const days = Math.floor(diffMinutes / (24 * 60));
      return t('days_ago', { count: days });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-lg z-10 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <HiOutlineUsers className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {t('collaborators')}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <HiOutlineX className="h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('online')} ({allUsers.filter(user => user.isOnline).length})
          </div>
          <div className="space-y-2">
            {allUsers
              .filter(user => user.isOnline)
              .map(user => (
                <div 
                  key={user.peerId}
                  className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="relative">
                    <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-300 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name} {user.isCurrentUser && `(${t('you')})`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('online')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('offline')} ({allUsers.filter(user => !user.isOnline).length})
          </div>
          <div className="space-y-2">
            {allUsers
              .filter(user => !user.isOnline)
              .map(user => (
                <div 
                  key={user.peerId}
                  className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="relative">
                    <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-transparent rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {t('last_seen')} {formatLastSeen(user.lastSeen)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorsList; 