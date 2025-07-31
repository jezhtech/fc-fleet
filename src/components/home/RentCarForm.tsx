import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  MapPin,
  CreditCard,
  Check,
  FileText,
  Book,
  Clock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { LocationSelector, RouteMap } from "./booking-form";

// Emirates and their tour options
const emiratesData = {
  dubai: {
    name: "Dubai",
    hourlyTours: [
      {
        id: "dubai-half-day",
        name: "Dubai Half Day, 5hrs City Tour",
        duration: "5 hours",
      },
      {
        id: "dubai-full-day",
        name: "Dubai Full Day, 10hrs City Tour",
        duration: "10 hours",
      },
    ],
  },
  otherEmirates: {
    name: "Other Emirates",
    hourlyTours: [
      {
        id: "abu-dhabi-half-day",
        name: "Abu Dhabi Half Day, 5hrs City Tour",
        duration: "5 hours",
      },
      {
        id: "sharjah-half-day",
        name: "Sharjah Half Day, 5hrs City Tour",
        duration: "5 hours",
      },
      {
        id: "fujairah-half-day",
        name: "Fujairah Half Day, 5hrs City Tour",
        duration: "5 hours",
      },
      {
        id: "al-ain-half-day",
        name: "Al Ain Half Day, 5hrs City Tour",
        duration: "5 hours",
      },
    ],
  },
};

const carCategories = [
  {
    id: "economy",
    name: "Economy",
    description: "Affordable for daily use",
    price: "$12/hour",
    emoji: "🚗",
  },
  {
    id: "comfort",
    name: "Comfort",
    description: "More comfort and space",
    price: "$18/hour",
    emoji: "🚕",
  },
  {
    id: "suv",
    name: "SUV",
    description: "Spacious vehicles for groups",
    price: "$24/hour",
    emoji: "🚙",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Luxury vehicles",
    price: "$35/hour",
    emoji: "🏎️",
  },
];

const carModels = {
  economy: [
    {
      id: "hyundai-i20",
      name: "Hyundai i20",
      image: "🚗",
      description: "Fuel efficient compact car",
    },
    {
      id: "suzuki-swift",
      name: "Suzuki Swift",
      image: "🚗",
      description: "Easy to drive and park",
    },
  ],
  comfort: [
    {
      id: "volkswagen-jetta",
      name: "Volkswagen Jetta",
      image: "🚕",
      description: "Comfortable sedan with modern features",
    },
    {
      id: "hyundai-elantra",
      name: "Hyundai Elantra",
      image: "🚕",
      description: "Stylish with good fuel economy",
    },
  ],
  suv: [
    {
      id: "hyundai-creta",
      name: "Hyundai Creta",
      image: "🚙",
      description: "Compact SUV with good ground clearance",
    },
    {
      id: "mahindra-xuv300",
      name: "Mahindra XUV300",
      image: "🚙",
      description: "Feature-rich compact SUV",
    },
  ],
  premium: [
    {
      id: "bmw-3-series",
      name: "BMW 3 Series",
      image: "🏎️",
      description: "Luxury sedan with powerful engine",
    },
    {
      id: "audi-a4",
      name: "Audi A4",
      image: "🏎️",
      description: "Premium comfort with advanced tech",
    },
  ],
};

const rentalStatuses = [
  { id: "initiated", label: "Booking Initiated", completed: true },
  { id: "processing", label: "Processing", completed: false },
  { id: "ready", label: "Car Ready for Pickup", completed: false },
  { id: "picked", label: "Car Picked Up", completed: false },
  { id: "returned", label: "Car Returned", completed: false },
];

const RentCarForm = () => {
  const [selectedEmirate, setSelectedEmirate] = useState<
    "dubai" | "otherEmirates"
  >("dubai");
  const [pickupDate, setPickupDate] = useState<Date | undefined>(new Date());
  const [pickupTime, setPickupTime] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("economy");
  const [selectedCarModel, setSelectedCarModel] = useState("");
  const [selectedHourlyTour, setSelectedHourlyTour] = useState("");
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupLocation: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVC: "",
  });

  // Location states for map integration
  const [selectedPickupLocation, setSelectedPickupLocation] =
    useState<any>(undefined);
  const [selectedDropoffLocation, setSelectedDropoffLocation] =
    useState<any>(undefined);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler for pickup location selection
  const handlePickupLocationSelect = (location: any) => {
    console.log("Selected pickup location:", location);
    setSelectedPickupLocation(location);
    setFormData((prev) => ({ ...prev, pickupLocation: location.name }));
  };

  // Handler for dropoff location selection
  const handleDropoffLocationSelect = (location: any) => {
    console.log("Selected dropoff location:", location);
    setSelectedDropoffLocation(location);
    setFormData((prev) => ({ ...prev, dropoffLocation: location.name }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.pickupLocation) {
        toast.error("Please enter pickup location");
        return;
      }
      if (!selectedHourlyTour) {
        toast.error("Please select an hourly tour");
        return;
      }
      if (!pickupDate) {
        toast.error("Please select pickup date");
        return;
      }
      if (!pickupTime) {
        toast.error("Please select pickup time");
        return;
      }

      // Check if booking is at least 4 hours in advance
      const now = new Date();
      const selectedDateTime = new Date(pickupDate);
      const [hours, minutes] = pickupTime.split(":").map(Number);
      selectedDateTime.setHours(hours, minutes, 0, 0);

      const timeDifference = selectedDateTime.getTime() - now.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference < 4) {
        toast.error("Bookings must be made at least 4 hours in advance");
        return;
      }

      setStep(2);
    } else if (step === 2) {
      if (!selectedCategory) {
        toast.error("Please select a car category");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!selectedCarModel) {
        toast.error("Please select a car model");
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (
        !formData.cardNumber ||
        !formData.cardName ||
        !formData.cardExpiry ||
        !formData.cardCVC
      ) {
        toast.error("Please fill in all payment details");
        return;
      }
      setStep(5);
      toast.success(
        "Chauffeur booking initiated! Your request is being processed."
      );
    }
  };

  // Function to handle receipt download
  const handleDownloadReceipt = () => {
    toast.success("Receipt downloaded successfully");
    // In a real app, this would generate and download a PDF receipt
  };

  // Time options for pickup
  const timeOptions = [
    "08:00 AM",
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
  ];

  // Calculate minimum booking time (4 hours from now)
  const getMinimumBookingTime = () => {
    const now = new Date();
    const minTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
    return minTime;
  };

  // Get available time options based on selected date
  const getAvailableTimeOptions = (selectedDate: Date | undefined) => {
    if (!selectedDate) return timeOptions;

    const now = new Date();
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const todayOnly = new Date(now);
    todayOnly.setHours(0, 0, 0, 0);

    // If selected date is today, filter out times that are less than 4 hours from now
    if (selectedDateOnly.getTime() === todayOnly.getTime()) {
      const minTime = getMinimumBookingTime();
      return timeOptions.filter((time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const timeDate = new Date(selectedDate);
        timeDate.setHours(hours, minutes, 0, 0);
        return timeDate >= minTime;
      });
    }

    return timeOptions;
  };

  // Check if a date should be disabled in the calendar
  const isDateDisabled = (date: Date) => {
    const now = new Date();
    const minBookingDate = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours from now
    return date < minBookingDate;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {step === 1 && (
        <>
          {/* Emirates Selection Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-x-2">
            <button
              type="button"
              onClick={() => setSelectedEmirate("dubai")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedEmirate === "dubai"
                  ? "bg-gradient-to-r from-fleet-red to-fleet-accent text-white"
                  : "text-black hover:bg-gray-200"
              }`}
            >
              Dubai
            </button>
            <button
              type="button"
              onClick={() => setSelectedEmirate("otherEmirates")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                selectedEmirate === "otherEmirates"
                  ? "bg-gradient-to-r from-fleet-red to-fleet-accent text-white"
                  : "text-black hover:bg-gray-200"
              }`}
            >
              Other Emirates
            </button>
          </div>

          {/* Pickup Location with Map Integration */}
          <div className="space-y-3">
            <LocationSelector
              id="pickup"
              label="Pickup Location"
              value={formData.pickupLocation}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, pickupLocation: value }))
              }
              onLocationSelect={handlePickupLocationSelect}
              placeholder="Enter Location"
            />

            {/* Route Map */}
            <div className="mt-2">
              <RouteMap
                pickupLocation={selectedPickupLocation}
                dropoffLocation={selectedDropoffLocation}
              />
            </div>
          </div>

          {/* Hourly Tour Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hourly</label>
            <Select
              value={selectedHourlyTour}
              onValueChange={setSelectedHourlyTour}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Hourly Tour" />
              </SelectTrigger>
              <SelectContent>
                {emiratesData[selectedEmirate].hourlyTours.map((tour) => (
                  <SelectItem key={tour.id} value={tour.id}>
                    {tour.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pickup Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="pickup-date" className="text-sm font-medium">
                Pickup Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="pickup-date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {pickupDate ? (
                      format(pickupDate, "PPP")
                    ) : (
                      <span>Select Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={pickupDate}
                    onSelect={setPickupDate}
                    initialFocus
                    disabled={isDateDisabled}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label htmlFor="pickup-time" className="text-sm font-medium">
                Pickup Time
              </label>
              <Select value={pickupTime} onValueChange={setPickupTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTimeOptions(pickupDate).map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Information Icon */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="h-4 w-4" />
            <span>Please ensure all details are correct before proceeding</span>
          </div>

          {/* 4-hour advance booking notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">
                  Advance Booking Required
                </p>
                <p className="text-blue-700 mt-1">
                  Bookings must be made at least 4 hours in advance. This
                  ensures we can provide the best service for your tour.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-9 text-white text-sm font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all rounded-md"
          >
            Find My Chauffeur
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
                  className={`border rounded-md p-3 hover:border-fleet-red cursor-pointer transition-colors ${
                    selectedCategory === category.id
                      ? "border-fleet-red bg-fleet-red/10"
                      : ""
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <RadioGroupItem
                    value={category.id}
                    id={category.id}
                    className="sr-only"
                  />
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{category.emoji}</span>
                    <div>
                      <h4 className="text-sm font-medium">{category.name}</h4>
                      <p className="text-xs text-gray-500">
                        {category.description}
                      </p>
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
              className="flex-1 h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(1)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
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
              {carModels[selectedCategory as keyof typeof carModels].map(
                (car) => (
                  <div
                    key={car.id}
                    className={`border rounded-md p-3 hover:border-fleet-red cursor-pointer transition-colors ${
                      selectedCarModel === car.id
                        ? "border-fleet-red bg-fleet-red/10"
                        : ""
                    }`}
                    onClick={() => setSelectedCarModel(car.id)}
                  >
                    <RadioGroupItem
                      value={car.id}
                      id={car.id}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{car.image}</span>
                      <div>
                        <h4 className="font-medium">{car.name}</h4>
                        <p className="text-sm text-gray-500">
                          {car.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </RadioGroup>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(2)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
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
              <label htmlFor="cardNumber" className="text-sm font-medium">
                Card Number
              </label>
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
              <label htmlFor="cardName" className="text-sm font-medium">
                Cardholder Name
              </label>
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
                <label htmlFor="cardExpiry" className="text-sm font-medium">
                  Expiry Date
                </label>
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
                <label htmlFor="cardCVC" className="text-sm font-medium">
                  CVC
                </label>
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
              className="flex-1 h-8 text-xs border-gray-300 hover:bg-gray-50 transition-all"
              onClick={() => setStep(3)}
            >
              Back
            </Button>
            <Button
              type="submit"
              className="flex-1 h-8 text-xs text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 hover:shadow-md transition-all"
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
          <h3 className="text-xl font-bold text-green-600 mb-2">
            Booking Initiated!
          </h3>
          <p className="text-gray-600 mb-4">Your request is being processed.</p>

          <div className="mb-6">
            <ol className="relative border-l border-gray-200 dark:border-gray-700">
              {rentalStatuses.map((status, index) => (
                <li key={status.id} className="mb-6 ml-4">
                  <div
                    className={`absolute w-3 h-3 rounded-full mt-1.5 -left-1.5 border ${
                      index === 0
                        ? "bg-green-500 border-green-500"
                        : "bg-gray-200 border-gray-200"
                    }`}
                  ></div>
                  <p
                    className={`text-sm font-semibold ${
                      index === 0 ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {status.label}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <Card className="p-4 text-left mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Emirate:</span>
                <span className="font-medium">
                  {emiratesData[selectedEmirate].name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tour Package:</span>
                <span className="font-medium">
                  {
                    emiratesData[selectedEmirate].hourlyTours.find(
                      (t) => t.id === selectedHourlyTour
                    )?.name
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pickup Location:</span>
                <span className="font-medium">{formData.pickupLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pickup Date:</span>
                <span className="font-medium">
                  {pickupDate ? format(pickupDate, "PPP") : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Pickup Time:</span>
                <span className="font-medium">{pickupTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Car Category:</span>
                <span className="font-medium">
                  {carCategories.find((c) => c.id === selectedCategory)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Car Model:</span>
                <span className="font-medium">
                  {
                    carModels[selectedCategory as keyof typeof carModels].find(
                      (c) => c.id === selectedCarModel
                    )?.name
                  }
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
              <Button className="w-full text-white font-medium bg-gradient-to-r from-fleet-red to-fleet-accent hover:opacity-90 flex items-center justify-center">
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
              Book Another Chauffeur
            </Button>
          </div>
        </div>
      )}
    </form>
  );
};

export default RentCarForm;
