import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Ban } from 'lucide-react';
import { TransportType } from './types';

interface TransportTypeSelectorProps {
  transportTypes: TransportType[];
  selectedTaxiType: string;
  onSelect: (typeId: string) => void;
  loading: boolean;
  availableTypes?: string[];
}

const TransportTypeSelector: React.FC<TransportTypeSelectorProps> = ({
  transportTypes,
  selectedTaxiType,
  onSelect,
  loading,
  availableTypes = []
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-fleet-red" />
        <span className="ml-2">Loading transport types...</span>
      </div>
    );
  }
  
  const isTypeAvailable = (typeId: string): boolean => {
    return availableTypes.includes(typeId);
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Transport Type</label>
      <RadioGroup 
        // value={selectedTaxiType} 
        // onValueChange={onSelect}
        className="grid grid-cols-2 gap-3"
      >
        {transportTypes.map((type) => {
          const isAvailable = isTypeAvailable(type.id);
          return (
            <div 
              key={type.id} 
              className={`relative border rounded-md p-3 transition-colors ${
                selectedTaxiType === type.id ? 'border-fleet-red bg-fleet-red/10' : ''
              } ${
                isAvailable 
                  ? 'hover:border-fleet-red cursor-pointer' 
                  : 'opacity-65 cursor-default bg-gray-50'
              }`}
              onClick={() => {
                onSelect(type.id);
              }}
            >
              <RadioGroupItem 
                value={type.id} 
                id={type.id} 
                className="sr-only"
                disabled={!isAvailable} 
              />
              <div className="flex items-start gap-2">
                <span className="text-xl">{type.emoji}</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{type.name}</h4>
                  <p className="text-xs text-gray-500">{type.description}</p>
                  {!isAvailable && (
                    <div className="mt-1.5 flex items-center">
                      <span className="bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-sm font-medium flex items-center">
                        <Ban size={12} className="mr-1" /> Currently unavailable
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {!isAvailable && (
                <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-[1px] rounded-md"></div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default TransportTypeSelector; 
 