import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Ban, Clock, Calendar, Info } from 'lucide-react';
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

  const handleTypeSelect = (typeId: string) => {
    if (isTypeAvailable(typeId)) {
      onSelect(typeId);
    }
  };
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Transport Type</label>
      <RadioGroup 
        value={selectedTaxiType} 
        onValueChange={onSelect}
        className="grid grid-cols-1 gap-4"
      >
        {transportTypes.map((type) => {
          const isAvailable = isTypeAvailable(type.id);
          return (
            <div 
              key={type.id} 
              className={`relative border rounded-lg p-4 transition-all ${
                selectedTaxiType === type.id 
                  ? 'border-fleet-red bg-fleet-red/5 shadow-sm' 
                  : 'border-gray-200 hover:border-gray-300'
              } ${
                isAvailable 
                  ? 'cursor-pointer bg-white' 
                  : 'opacity-60 cursor-default bg-gray-50'
              }`}
              onClick={() => handleTypeSelect(type.id)}
            >
              <RadioGroupItem 
                value={type.id} 
                id={type.id} 
                className="sr-only"
                disabled={!isAvailable} 
              />
              
              <div className="flex items-start gap-4">
                {/* Left section with text content */}
                <div className="flex-1 space-y-3">
                  {/* Transport type name as heading */}
                  <h3 className={`text-lg font-semibold ${
                    selectedTaxiType === type.id ? 'text-fleet-red' : 'text-gray-900'
                  }`}>
                    {type.name}
                  </h3>
                  
                  {/* Car models list */}
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      {type.carModels || type.description || 'Skoda Octavia, Ford Focus, Volkswagen Golf, Toyota Corolla, etc.'}
                    </p>
                  </div>
                  
                  {/* Service details with icons */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>15 min waiting</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Cancel for free</span>
                      <Info className="h-3 w-3 cursor-help" />
                    </div>
                  </div>
                </div>
                
                {/* Right section with car image/emoji */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">{type.emoji}</span>
                  </div>
                </div>
              </div>
              
              {/* Unavailable indicator */}
              {!isAvailable && (
                <div className="absolute top-3 right-3">
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-md font-medium flex items-center">
                    <Ban size={12} className="mr-1" /> Unavailable
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default TransportTypeSelector; 
 