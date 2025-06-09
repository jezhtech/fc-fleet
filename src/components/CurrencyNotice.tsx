import React from 'react';
import { AlertCircle } from 'lucide-react';
import { CURRENCY } from '@/utils/currency';

interface CurrencyNoticeProps {
  className?: string;
}

const CurrencyNotice: React.FC<CurrencyNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 ${className}`}>
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-800">Currency Update</h3>
          <p className="text-blue-700 text-sm mt-1">
            All prices throughout the application are now displayed in {CURRENCY.name} ({CURRENCY.code}). 
            If you have any questions about this change, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CurrencyNotice; 
 
 
 
 
 
 
 
 