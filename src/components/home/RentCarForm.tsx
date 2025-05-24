import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, CreditCard, Check, FileText, Book } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const carCategories = [
  { id: 'economy', name: 'Economy', description: 'Affordable for daily use', price: '$12/hour', emoji: '🚗' },
  { id: 'comfort', name: 'Comfort', description: 'More comfort and space', price: '$18/hour', emoji: '🚕' },
  { id: 'suv', name: 'SUV', description: 'Spacious vehicles for groups', price: '$24/hour', emoji: '🚙' },
  { id: 'premium', name: 'Premium', description: 'Luxury vehicles', price: '$35/hour', emoji: '🏎️' }
];

const carModels = {
  economy: [
    { id: 'hyundai-i20', name: 'Hyundai i20', image: '🚗', description: 'Fuel efficient compact car' },
    { id: 'suzuki-swift', name: 'Suzuki Swift', image: '🚗', description: 'Easy to drive and park' }
  ],
  comfort: [
    { id: 'volkswagen-jetta', name: 'Volkswagen Jetta', image: '🚕', description: 'Comfortable sedan with modern features' },
    { id: 'hyundai-elantra', name: 'Hyundai Elantra', image: '🚕', description: 'Stylish with good fuel economy' }
  ],
  suv: [
    { id: 'hyundai-creta', name: 'Hyundai Creta', image: '🚙', description: 'Compact SUV with good ground clearance' },
    { id: 'mahindra-xuv300', name: 'Mahindra XUV300', image: '🚙', description: 'Feature-rich compact SUV' }
  ],
  premium: [
    { id: 'bmw-3-series', name: 'BMW 3 Series', image: '🏎️', description: 'Luxury sedan with powerful engine' },
    { id: 'audi-a4', name: 'Audi A4', image: '🏎️', description: 'Premium comfort with advanced tech' }
  ]
};

const rentalStatuses = [
  { id: 'initiated', label: 'Booking Initiated', completed: true },
  { id: 'processing', label: 'Processing', completed: false },
  { id: 'ready', label: 'Car Ready for Pickup', completed: false },
  { id: 'picked', label: 'Car Picked Up', completed: false },
  { id: 'returned', label: 'Car Returned', completed: false }
];

const RentCarForm = () => {
  const [pickupDate, setPickupDate] = useState<Date | undefined>(new Date());
  const [dropoffDate, setDropoffDate] = useState<Date | undefined>(
    new Date(new Date().setDate(new Date().getDate() + 3))
  );
  const [selectedCategory, setSelectedCategory] = useState('economy');
  const [selectedCarModel, setSelectedCarModel] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocation: '',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCVC: ''
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.pickupLocation) {
        toast.error('Please enter pickup location');
        return;
      }
      if (!pickupDate || !dropoffDate) {
        toast.error('Please select both pickup and return dates');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        toast.error('Please select a car category');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedCarModel) {
        toast.error('Please select a car model');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!formData.cardNumber || !formData.cardName || !formData.cardExpiry || !formData.cardCVC) {
        toast.error('Please fill in all payment details');
        return;
      }
      setStep(5);
      toast.success('Rental booking initiated! Your request is being processed.');
    }
  };
  
  // Function to handle receipt download
  const handleDownloadReceipt = () => {
    toast.success('Receipt downloaded successfully');
    // In a real app, this would generate and download a PDF receipt
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 && (
        <>
          <div className="space-y-2">
            <label htmlFor="pickup-location" className="text-sm font-medium">Pickup Location</label>
            <div className="relative">
              <MapPin className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
              <Input
                id="pickup-location"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleInputChange}
                placeholder="Enter pickup location"
                className="pl-8"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="pickup-date" className="text-sm font-medium">Pickup Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="pickup-date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pickupDate ? format(pickupDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pickupDate}
                    onSelect={setPickupDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="dropoff-date" className="text-sm font-medium">Return Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="dropoff-date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dropoffDate ? format(dropoffDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dropoffDate}
                    onSelect={setDropoffDate}
                    initialFocus
                    fromDate={pickupDate || new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
          >
            Next: Choose Car Type
          </Button>
        </>
      )}
      
      {step === 2 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Car Category</label>
            <RadioGroup 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              className="grid grid-cols-2 gap-3"
            >
              {carCategories.map((category) => (
                <div 
                  key={category.id} 
                  className={`border rounded-md p-3 hover:border-fleet-red cursor-pointer transition-colors ${selectedCategory === category.id ? 'border-fleet-red bg-fleet-red/10' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <RadioGroupItem value={category.id} id={category.id} className="sr-only" />
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{category.emoji}</span>
                    <div>
                      <h4 className="text-sm font-medium">{category.name}</h4>
                      <p className="text-xs text-gray-500">{category.description}</p>
                      <p className="text-xs font-bold mt-1">{category.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
            >
              Next: Choose Car
            </Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Available Cars</label>
            <RadioGroup 
              value={selectedCarModel} 
              onValueChange={setSelectedCarModel}
              className="space-y-3"
            >
              {carModels[selectedCategory as keyof typeof carModels].map((car) => (
                <div 
                  key={car.id} 
                  className={`border rounded-md p-3 hover:border-fleet-red cursor-pointer transition-colors ${selectedCarModel === car.id ? 'border-fleet-red bg-fleet-red/10' : ''}`}
                  onClick={() => setSelectedCarModel(car.id)}
                >
                  <RadioGroupItem value={car.id} id={car.id} className="sr-only" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{car.image}</span>
                    <div>
                      <h4 className="font-medium">{car.name}</h4>
                      <p className="text-sm text-gray-500">{car.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
            >
              Next: Payment
            </Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="space-y-4">
            <h3 className="font-medium">Payment Details</h3>
            <div>
              <label htmlFor="cardNumber" className="text-sm font-medium">Card Number</label>
              <div className="relative">
                <CreditCard className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                <Input
                  id="cardNumber"
                  name="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  className="pl-8"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="cardName" className="text-sm font-medium">Cardholder Name</label>
              <Input
                id="cardName"
                name="cardName"
                placeholder="John Smith"
                value={formData.cardName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="cardExpiry" className="text-sm font-medium">Expiry Date</label>
                <Input
                  id="cardExpiry"
                  name="cardExpiry"
                  placeholder="MM/YY"
                  value={formData.cardExpiry}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="cardCVC" className="text-sm font-medium">CVC</label>
                <Input
                  id="cardCVC"
                  name="cardCVC"
                  placeholder="123"
                  value={formData.cardCVC}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              type="button"
              variant="outline" 
              className="flex-1"
              onClick={() => setStep(3)}
            >
              Back
            </Button>
            <Button 
              type="submit" 
              className="flex-1 text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90"
            >
              Confirm Payment
            </Button>
          </div>
        </>
      )}
      
      {step === 5 && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-600 mb-2">Booking Initiated!</h3>
          <p className="text-gray-600 mb-4">Your request is being processed.</p>
          
          <div className="mb-6">
            <ol className="relative border-l border-gray-200 dark:border-gray-700">
              {rentalStatuses.map((status, index) => (
                <li key={status.id} className="mb-6 ml-4">
                  <div className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border ${index === 0 ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-200'}`}></div>
                  <p className={`text-sm font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-500'}`}>{status.label}</p>
                </li>
              ))}
            </ol>
          </div>
          
          <Card className="p-4 text-left mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pickup Location:</span>
                <span className="font-medium">{formData.pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pickup Date:</span>
                <span className="font-medium">{pickupDate ? format(pickupDate, "PPP") : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Return Date:</span>
                <span className="font-medium">{dropoffDate ? format(dropoffDate, "PPP") : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Car Category:</span>
                <span className="font-medium">{carCategories.find(c => c.id === selectedCategory)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Car Model:</span>
                <span className="font-medium">
                  {carModels[selectedCategory as keyof typeof carModels].find(c => c.id === selectedCarModel)?.name}
                </span>
              </div>
            </div>
          </Card>
          
          <div className="flex flex-col space-y-3">
            <Button 
              variant="outline"
              onClick={handleDownloadReceipt}
              className="w-full flex items-center justify-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Download Payment Receipt
            </Button>
            
            <Link to="/my-bookings" className="w-full">
              <Button 
                className="w-full text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 flex items-center justify-center"
              >
                <Book className="mr-2 h-4 w-4" />
                View My Bookings
              </Button>
            </Link>
            
            <Button 
              type="button"
              variant="outline"
              onClick={() => setStep(1)} 
              className="w-full"
            >
              Book Another Car
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RentCarForm;
