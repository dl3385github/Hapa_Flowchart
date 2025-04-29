import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HiOutlineExclamationCircle, HiOutlineHome } from 'react-icons/hi';

const NotFound: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <HiOutlineExclamationCircle className="h-24 w-24 text-gray-400" />
      
      <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
        {t('page_not_found')}
      </h1>
      
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 text-center max-w-md">
        {t('page_not_found_message')}
      </p>
      
      <Link 
        to="/dashboard" 
        className="mt-8 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <HiOutlineHome className="mr-2" />
        {t('back_to_dashboard')}
      </Link>
    </div>
  );
};

export default NotFound; 